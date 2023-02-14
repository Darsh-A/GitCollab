export interface gitCollabSettings {

    token: string;
    owner: string;
    repo: string;
    checkInterval: number;
    checkTime: number;

    notice: boolean;
    status: boolean;
    username: string;
    fileOwners: boolean;
    nameOwners: string;

    debugMode: boolean;
    cronDebugLogger: boolean;
    commitDebugLogger: boolean;

    allFormatting: boolean;
    settingsNotSetStatus: string;
    settingsNotSetLabel: string;
    noCommitsFoundStatus: string;
    noCommitsFoundLabel: string;
    noticePrompt: string;
    fileEditableStatus: string;
    fileNotEditableStatus: string;
}