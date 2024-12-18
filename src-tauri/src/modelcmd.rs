use std::{fs::File, io::Read};
use image::GenericImageView;
use serde::Serialize;
use ort::session::{builder::GraphOptimizationLevel, Session};
use ndarray::{Array, s, Axis};


static PADDING: u32 = 200;

#[derive(Debug, Clone, Copy, Serialize)]
pub struct BoundingBox {
	x1: f32,
	y1: f32,
	x2: f32,
	y2: f32
}

fn intersection(box1: &BoundingBox, box2: &BoundingBox) -> f32 {
	(box1.x2.min(box2.x2) - box1.x1.max(box2.x1)) * (box1.y2.min(box2.y2) - box1.y1.max(box2.y1))
}

fn union(box1: &BoundingBox, box2: &BoundingBox) -> f32 {
	((box1.x2 - box1.x1) * (box1.y2 - box1.y1)) + ((box2.x2 - box2.x1) * (box2.y2 - box2.y1)) - intersection(box1, box2)
}

#[derive(Serialize, Clone, Debug)]
pub struct Detection {
    bbox: BoundingBox,
    class: usize,
    prob: f32
}

#[tauri::command(async)]
pub fn inference_yolov8(model: String, image_path: String) -> Result<Vec<Detection>, String> {
    let mut model_file = File::open(model).expect("Failed loading model file");
    let mut model_buf: Vec<u8> = vec![];
    let file_size = model_file.read_to_end(&mut model_buf).expect("failed to read model file");

    println!("===> Model file size: {}", file_size);

    let session_builder = Session::builder().unwrap()
    .with_optimization_level(GraphOptimizationLevel::Level3).unwrap()
    .with_intra_threads(4).unwrap();

    let session = session_builder.commit_from_memory(&model_buf)
        .map_err(|_err| "Failed reading model".to_string())?;

    println!("Model's Input: {:#?}", session.inputs);

    if session.inputs.len() != 1 {
        return Err("Invalid input number".to_string())
    }

    // for input in session.inputs {
    let input_dims = session.inputs[0].input_type.tensor_dimensions().expect("No input dim found");
    

    if input_dims.len() != 4 {
        return Err("Invalid input dim shape".to_string())
    } else if input_dims[2] != input_dims[3] {
        return Err("Invalid input w&h".to_string())
    }

    if cfg!(debug_assertions) {
        println!("Batch size: {}", input_dims[0]);
        println!("Number of channel: {}", input_dims[1]);
        println!("input width: {}", input_dims[2]);
        println!("input height: {}", input_dims[3]);
    }
    let img = image::open(image_path).expect("Failed to open image");
    let mut boxes: Vec<Detection> = Vec::new();

    let area_width = input_dims[2] as u32;
    let distance = area_width - PADDING;
    let x_num = (img.width() / distance) + 1;
    let y_num = (img.height() / distance) + 1;
    println!("x_num: {}, y_num: {}, distance: {}", x_num, y_num, distance);


    for x in 0..x_num {
        for y in 0..y_num {
            let cropped_img = img.crop_imm(x * distance, y * distance, area_width, area_width);
            let mut input = Array::zeros((
                input_dims[0] as usize, 
                input_dims[1] as usize, 
                input_dims[2] as usize, 
                input_dims[3] as usize
            )).into_dyn();
            
            for pixel in cropped_img.pixels() {
                let x = pixel.0 as usize;
                let y = pixel.1 as usize;
                let [r,g,b,_] = pixel.2.0;
                input[[0, 0, y, x]] = (r as f32) / 255.0;
                input[[0, 1, y, x]] = (g as f32) / 255.0;
                input[[0, 2, y, x]] = (b as f32) / 255.0;
            }

            let outputs = session.run(ort::inputs![input].unwrap()).unwrap();
            let output = outputs["output0"].try_extract_tensor::<f32>().unwrap().t().into_owned();

            let output = output.slice(s![.., .., 0]);
            for row in output.axis_iter(Axis(0)) {
                let row: Vec<_> = row.iter().copied().collect();
                let (class_id, prob) = row
                    .iter()
                    // skip bounding box coordinates
                    .skip(4)
                    .enumerate()
                    .map(|(index, value)| (index, *value))
                    .reduce(|accum, row| if row.1 > accum.1 { row } else { accum })
                    .unwrap();
                if prob < 0.5 {
                    continue;
                }
                // println!("===> Detected raw: {} {} {} {}", row[0], row[1], row[2], row[3]);
                let xc = row[0];
                let yc = row[1];
                let w = row[2];
                let h = row[3];
                println!("======> Detected: {} {} {} {} with probability: {}", xc, yc, w, h, prob);
                boxes.push(Detection {
                    bbox: BoundingBox {
                        x1: xc - w / 2. + ((x * distance) as f32),
                        y1: yc - h / 2. + ((y * distance) as f32),
                        x2: xc + w / 2. + ((x * distance) as f32),
                        y2: yc + h / 2. + ((y * distance) as f32),
                    },
                    class: class_id,
                    prob
                });
            }

            println!("===> Detected part ({}, {})", x, y);
        }
    }

    boxes.sort_by(|box1, box2| box2.prob.total_cmp(&box1.prob));

    let mut result = Vec::new();

	while !boxes.is_empty() {
		result.push(boxes[0].clone());
		boxes = boxes
			.iter()
			.filter(|box1| intersection(&boxes[0].bbox, &box1.bbox) / union(&boxes[0].bbox, &box1.bbox) < 0.7)
			.cloned()
            .collect();
	}

    Ok(result)
}