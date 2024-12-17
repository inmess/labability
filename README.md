# Labability - Image Label Tool

## Motivation

I couldn't find a image label tool for my projects, so I decided to make one. This project is designed to label images, without any requirements for internet or self-deployed server.

## Roadmap

- [x] label tool
- [x] choose YOLO model file to inference
- [x] use hardware acceleration for inference
- [ ] customizable object classes
- [ ] multiple export options

## Build
```bash
yarn tauri build
```

## Development
```bash
yarn tauri dev
```

Based on [Tauri](https://tauri.app), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)