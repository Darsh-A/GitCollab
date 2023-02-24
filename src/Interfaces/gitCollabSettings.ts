export interface gitCollabSettings {

    token: string;
    owner: string;
    repo: string;
    checkInterval: number;
    checkTime: number;

    notice: boolean;
    noticePrompt: string;

    status: boolean;
    username: string;

    debugMode: boolean;
    cronDebugLogger: boolean;
    commitDebugLogger: boolean;

    allFormatting: boolean;
    settingsNotSetStatus: string;
    settingsNotSetLabel: string;
    noCommitsFoundStatus: string;
    noCommitsFoundLabel: string;
    fileEditableStatus: string;
    fileNotEditableStatus: string;

    ribbon: boolean;
    ribbonCheckInterval: number;
    ribbonModalTitleCSS: string;
    ribbonModalFetchingCommitsCSS: string;
    ribbonModalNoCommitsCSS: string;
    ribbonModalNoCommitsText: string;
    ribbonModalAuthorCSS: string;
    ribbonModalFileNameCSS: string;
    ribbonModalFilePathCSS: string;
}