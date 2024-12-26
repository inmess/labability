import { invoke } from "@tauri-apps/api/core";
import { appCacheDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { exists, mkdir, remove } from "@tauri-apps/plugin-fs";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useCallback, useEffect, useState } from "react";


const keystoreAtom = atomWithStorage<string | undefined>("keystore", undefined)

export default function useDecryption() {
    const [ keystore, setKeystore ] = useAtom(keystoreAtom)

    const [ decImages, setDecImages ] = useState<{
        [key: string]: { path: string, timestamp: number }
    }>({})

    const [ dest, setDest ] = useState("")

    useEffect(() => {
        async function initDest() {
            const appCacheDirPath = await appCacheDir()
            const randomName = (Math.random() * 100000000000).toFixed()
            const targetPath = await join(appCacheDirPath, "img_store", randomName)
            setDest(targetPath)
        }
        initDest()
    }, [])

    const pickKeystore = async () => {
        const path = await open({
            multiple: false,
            directory: false,
            filters: [{
                name: '',
                extensions: ['keystore']
            }]
        })

        if(path === null) return

        setKeystore(path)
    }

    const decryptContent = useCallback(async (path: string) => {
        if(!keystore) return false

        if(dest === "") return false

        const filename = path.split("/").pop()?.split("\\").pop()

        if(!filename) return false

        const isDestExists = await exists(dest)

        if(!isDestExists) {
            await mkdir(dest, { recursive: true })
        }

        if(Object.keys(decImages).length >= 20) {
            const keys: string[] = Object.keys(decImages);
            keys.sort((a, b) => decImages[a].timestamp - decImages[b].timestamp);
            const key = keys[0];
            await remove(decImages[key].path)
            setDecImages((cache) => {
                delete cache[key];
                return cache;
            });
        }

        const target = await join(dest, filename)

        await invoke("decrypt_content", { path, dest: target, keystore })

        const time = new Date().getTime()

        setDecImages(cache => ({
            ...cache,
            [filename]: { path: target, timestamp: time }
        }))

        return true

    }, [keystore, dest])

    const clearCache = useCallback(async () => {
        await remove(dest, { recursive: true })
    }, [])

    return {
        keystore,
        pickKeystore,
        decryptContent,
        decImages,
        clearCache
    }
}