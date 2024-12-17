import { FileEntry } from '@/types/basetype';
import { join } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir } from '@tauri-apps/plugin-fs';
import { useEffect, useMemo, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

const imageExtensions = ['jpg', 'jpeg', 'png']

const isImage = (name: string) => {
    const ext = name.split('.').pop()
    return imageExtensions.includes(ext!.toLowerCase())
}

export default function useImgDir() {

    const [ dir, setDir ] = useState<string | null>(null)

    const [ files, setFiles ] = useState<FileEntry[]>([])

    const [ selectedFile, setSelectedFile ] = useState<FileEntry | null>(null)

    const hasNext = useMemo(() => {
        if(!selectedFile) return false
        const idx = files.findIndex(f => f.name === selectedFile.name)
        return idx < files.length - 1
    }, [selectedFile, files])

    const hasPrev = useMemo(() => {
        if(!selectedFile) return false
        const idx = files.findIndex(f => f.name === selectedFile.name)
        return idx > 0
    }, [selectedFile, files])
    
    const nextFile = () => {
        if(!selectedFile) return
        if(!hasNext) return
        const idx = files.findIndex(f => f.name === selectedFile.name)
        if(idx === -1) return
        const nextIdx = (idx + 1) % files.length
        setSelectedFile(files[nextIdx])
    }

    const prevFile = () => {
        if(!selectedFile) return
        if(!hasPrev) return
        const idx = files.findIndex(f => f.name === selectedFile.name)
        if(idx === -1) return
        const prevIdx = (idx - 1 + files.length) % files.length
        setSelectedFile(files[prevIdx])
    }

    const openImgDir = async () => {
        const directory = await open({
            directory: true
        })
        setDir(directory)
    }

    const closeImgDir = () => {
        setDir(null)
        setFiles([])
        setSelectedFile(null)
    }

    useEffect(() => {
        async function fetchFiles() {
            if(!dir) return
            const entries = await readDir(dir!)
            const files = entries
                .map((e) => ({
                    name: e.name,
                    path: '',
                    src: ''
                }))
                .filter(e => isImage(e.name))

            for(const file of files) {
                file.path = await join(dir!, file.name)
                file.src = convertFileSrc(file.path)
            }
            setFiles(files)
        }
        fetchFiles()
        
    }, [dir])

    return {
        dir,
        files,
        openImgDir,
        selectedFile,
        setSelectedFile,
        nextFile,
        prevFile,
        closeImgDir
    }
}