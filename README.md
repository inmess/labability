# Labability - Image Label Tool

## Motivation

I couldn't find a image label tool for my other projects, so I decided to make one. This app is designed to label images, without any requirements of internet or self-deployed server.

## Guide

### Common Usage
1. Open the image folder you want to label
2. Press `Alt` while drag the mouse to draw a bounding box
3. Click on the box label to adjust the box
4. Double click anywhere outside the box to stop adjusting
5. Press `Ctrl + Z` to undo, `Ctrl + Shift + Z` to redo (not very stable)

> Tips: On the right-top corner, you can resize the image to fit the window, or switch adjust mode.

### Inferencing (Tested on Yolo V8 with only ONE class)
> Well, I'm only doing this for my other project right now, and that requires only one class, so...🤣
1. Choose the YOLO model file you want to use in the tab with icon aimer
2. Configure the confidence threshold if needed
3. Press `Detect` button
4. Agree to detect (can be default agree in the checkbox below)

### Configuration
1. Press the gear icon on the sidebar
2. Configure the object classes and their color/name

## Roadmap

- [x] label tool
- [x] choose YOLO model file to inference
- [x] use hardware acceleration for inference
- [x] customizable object classes
- [x] customizable classes color/name
- [ ] multiple export options
- [ ] history(undo/redo) function
- [ ] suppport YOLO end2end model

## Build
```bash
yarn tauri build
```

## Development
```bash
yarn tauri dev
```

Based on [Tauri](https://tauri.app), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)