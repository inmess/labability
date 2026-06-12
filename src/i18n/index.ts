import { useAtom } from "jotai";
import { useMemo } from "react";
import { Language, languageAtom } from "@/utils/atoms";

type TranslationDict = {
    appTitle: string;
    app: {
        loading: string;
        detecting: string;
        saveWorkspace: string;
        savingWorkspace: string;
        workspaceSaved: string;
        failedToSaveWorkspace: string;
        closeWorkspaceConfirmTitle: string;
        closeWorkspaceConfirmMessage: string;
        closeWorkspaceUnsavedConfirmMessage: string;
        close: string;
        folder: string;
        version: string;
        welcome: string;
        openImageDirectory: string;
        language: string;
        toggleLanguage: string;
    };
    fileExplorer: {
        title: string;
        noImageFound: string;
        boundingBoxes: string;
        editBox: string;
        boxClass: string;
        searchClass: string;
        noClassFound: string;
        deleteBox: string;
    };
    imageInfo: {
        title: string;
        noImageSelected: string;
        copyPath: string;
        dimensions: string;
        labels: string;
    };
    config: {
        noWorkspaceLoaded: string;
        title: string;
        classesSection: string;
        addClass: string;
        classConfiguration: string;
        className: string;
        classStrokeColor: string;
        save: string;
        deleteClass: string;
        deleteClassConfirmTitle: string;
        deleteClassConfirmMessage: string;
        keepOneClassHint: string;
        classId: (id: number) => string;
    };
    detect: {
        noDetectionConfig: string;
        title: string;
        modelSection: string;
        noModelLoaded: string;
        loadModel: string;
        threshold: string;
        detect: string;
        defaultAgree: string;
        boundingBoxes: string;
        confirmTitle: string;
        confirmMessage: string;
    };
};

const translations: Record<Language, TranslationDict> = {
    en: {
        appTitle: "Labability v2",
        app: {
            loading: "Loading...",
            detecting: "Detecting...",
            saveWorkspace: "Save Workspace",
            savingWorkspace: "Saving workspace...",
            workspaceSaved: "Workspace saved",
            failedToSaveWorkspace: "Failed to save workspace",
            closeWorkspaceConfirmTitle: "Close Workspace",
            closeWorkspaceConfirmMessage: "Are you sure you want to close the current workspace?",
            closeWorkspaceUnsavedConfirmMessage: "The current workspace has unsaved changes. Are you sure you want to close it?",
            close: "Close",
            folder: "Folder",
            version: "Ver.",
            welcome: "Welcome to Labability v2",
            openImageDirectory: "Open Image Directory",
            language: "Language",
            toggleLanguage: "中文",
        },
        fileExplorer: {
            title: "EXPLORER",
            noImageFound: "No image found",
            boundingBoxes: "BOUNDING-BOXES",
            editBox: "Edit Box",
            boxClass: "Box Class",
            searchClass: "Search Class",
            noClassFound: "No class found",
            deleteBox: "Delete Box",
        },
        imageInfo: {
            title: "INFO",
            noImageSelected: "No image selected",
            copyPath: "Copy Path",
            dimensions: "WxH",
            labels: "Labels",
        },
        config: {
            noWorkspaceLoaded: "No workspace loaded",
            title: "Configuration",
            classesSection: "Classes",
            addClass: "Add Class",
            classConfiguration: "Class Configuration",
            className: "Class Name",
            classStrokeColor: "Class Stroke Color",
            save: "Save",
            deleteClass: "Delete Class",
            deleteClassConfirmTitle: "Delete Class",
            deleteClassConfirmMessage: "Deleting this class will remove all annotated boxes that belong to it. Continue?",
            keepOneClassHint: "At least one class must remain.",
            classId: (id: number) => `ID ${id}`,
        },
        detect: {
            noDetectionConfig: "No detection config",
            title: "DETECT",
            modelSection: "Object Detection Model",
            noModelLoaded: "No model loaded",
            loadModel: "Load YOLOv8 Model",
            threshold: "Threshold",
            detect: "Detect",
            defaultAgree: "Default Agree",
            boundingBoxes: "BOUNDING-BOXES",
            confirmTitle: "Confirm Detection",
            confirmMessage: "Are you sure to detect? It may take a while.",
        },
    },
    "zh-CN": {
        appTitle: "Labability v2",
        app: {
            loading: "加载中...",
            detecting: "检测中...",
            saveWorkspace: "保存工作区",
            savingWorkspace: "正在保存工作区...",
            workspaceSaved: "工作区已保存",
            failedToSaveWorkspace: "工作区保存失败",
            closeWorkspaceConfirmTitle: "关闭工作区",
            closeWorkspaceConfirmMessage: "确定要关闭当前工作区吗？",
            closeWorkspaceUnsavedConfirmMessage: "当前工作区未保存，是否确认关闭当前工作区？",
            close: "关闭",
            folder: "工作区",
            version: "版本",
            welcome: "欢迎使用 Labability v2",
            openImageDirectory: "打开图片目录",
            language: "语言",
            toggleLanguage: "EN",
        },
        fileExplorer: {
            title: "文件浏览",
            noImageFound: "未找到图片",
            boundingBoxes: "标注框",
            editBox: "编辑标注框",
            boxClass: "框类别",
            searchClass: "搜索类别",
            noClassFound: "未找到类别",
            deleteBox: "删除标注框",
        },
        imageInfo: {
            title: "信息",
            noImageSelected: "未选择图片",
            copyPath: "复制路径",
            dimensions: "宽 x 高",
            labels: "标签",
        },
        config: {
            noWorkspaceLoaded: "未加载工作区",
            title: "配置",
            classesSection: "类别",
            addClass: "添加类别",
            classConfiguration: "类别配置",
            className: "类别名称",
            classStrokeColor: "类别描边颜色",
            save: "保存",
            deleteClass: "删除类别",
            deleteClassConfirmTitle: "删除类别",
            deleteClassConfirmMessage: "删除该类别后，所有已标注为该类别的框都会一并删除。确定继续吗？",
            keepOneClassHint: "至少需要保留一个类别。",
            classId: (id: number) => `ID ${id}`,
        },
        detect: {
            noDetectionConfig: "未配置检测参数",
            title: "检测",
            modelSection: "目标检测模型",
            noModelLoaded: "未加载模型",
            loadModel: "加载 YOLOv8 模型",
            threshold: "阈值",
            detect: "开始检测",
            defaultAgree: "默认跳过确认",
            boundingBoxes: "标注框",
            confirmTitle: "确认检测",
            confirmMessage: "确定开始检测吗？这可能需要一些时间。",
        },
    },
};

export function useI18n() {
    const [language, setLanguage] = useAtom(languageAtom);

    const texts = useMemo(() => translations[language] ?? translations.en, [language]);

    return {
        language,
        setLanguage,
        texts,
    };
}