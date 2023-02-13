export interface gitCollabSettings {

    token: string;
    owner: string;
    repo: string;
    checkInterval: number;
    checkTime: number;

    notice: boolean;
    status: boolean;
    emotes: boolean;
    activeEmote: string;
    noticePrompt: string;
    username: string;
    fileOwners: boolean;
    nameOwners: string;

    debugMode: boolean;
    cronDebugLogger: boolean;
    commitDebugLogger: boolean;
}