import { App, Editor, MarkdownView, Modal, Notice, Plugin} from 'obsidian';
import { Octokit } from 'octokit';
import { gitCollabSettingTab } from 'src/settings';
import { gitCollabSettings } from './Interfaces/gitCollabSettings';
var cron = require('node-cron');

export default class gitCollab extends Plugin {

    settings: gitCollabSettings;

    workspace: any;


    async onload() {

        console.log('Git-Collab Loaded!!!');

        //Load settings
        await this.loadSettings();
        this.addSettingTab(new gitCollabSettingTab(this.app, this));

        const statusBarItemEl = this.addStatusBarItem()

        //Add status bar item
        if (this.settings.status == true) {
            statusBarItemEl.setText('Loading...')
        }

        //Github Authentication
        const octokit = new Octokit({
            auth: this.settings.token,
        });

        //Check if the settings are set
        if (this.settings.token == '' || this.settings.owner == '' || this.settings.repo == '') {
            statusBarItemEl.setText('❌ Settings not set')
            statusBarItemEl.ariaLabel = 'Please check git collab settings tab.'
            return
        }

        //Cron Job
        const cronJob: String = `*/${this.settings.checkInterval} * * * * *`
        cron.schedule(cronJob, this.startCronJob(octokit, statusBarItemEl));
    }

    onunload() {
            console.log('Git Collab: Unloading Plugin')
    }

    async loadSettings() {
        
        const DEFAULT_SETTINGS: gitCollabSettings = {
            checkInterval: 15,
            checkTime: 2,
            token: '',
            owner: '',
            repo: '',
        
            notice: false,
            status: false,
            emotes: false,
            noticePrompt: 'File has been edited recently!!!\nCheck the status bar.',
            username: '',
            fileOwners: false,
            nameOwners: '',
        
            debugMode: false,
            cronDebugLogger: false,
            commitDebugLogger: false,
        
        };
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async startCronJob(octokit: Octokit, statusBarItemEl: any) {

        if (this.settings.debugMode && this.settings.cronDebugLogger){
            console.log(`Git Collab: Cron task started with a timer of ${this.settings.checkInterval}`);
        }

        const time_rn= new Date()
        const time_bf = new Date(time_rn.getTime() - this.settings.checkTime * 60000)

        if (this.settings.debugMode && this.settings.cronDebugLogger){
            console.log(`Git Collab: Time Range: ${time_bf} - ${time_rn}`);
        }

        const response = await octokit.request("GET /repos/{owner}/{repo}/commits{?since,until,per_page,page}", {
            owner: this.settings.owner,
            repo: this.settings.repo,
            since: time_bf.toISOString(),
            until: time_rn.toISOString(),
            per_page: 100,
            page: 1,
        });


        let sha = []
        for (let i = 0; i < response.data.length; i++) {
            sha.push(response.data[i].sha)
        }

        let commits = []
        for (let i = 0; i < sha.length; i++) {

            const response2 = await octokit.request("GET /repos/{owner}/{repo}/commits/{ref}{?sha}", {
                owner: this.settings.owner,
                repo: this.settings.repo,
                ref: 'main',
                sha: sha[i]
            })

            if (response2.data.commit.message.includes('vault backup')) {
                commits.push(response2.data);

                if (this.settings.commitDebugLogger){
                    console.log(`Git Collab: Commit added \n${response2.data.commit.message}`)
                }

            }
        }

        //If there are commits under the time interval
        if (commits.length != 0) {

            let filenames: string[] = []
            let files = []

            for (let i = 0; i < commits.length; i++) {

                for (let j = 0; j < commits[i].files.length; j++) {
                    filenames.indexOf(`${commits[i].commit.author.name} - ${commits[i].files[j].filename}`) == -1 ? filenames.push(`${commits[i].commit.author.name} - ${commits[i].files[j].filename}`) : null
                    files.indexOf(commits[i].files[j].filename) == -1 ? files.push(commits[i].files[j].filename) : null
                }
            }

            //Status Bar!!
            if (this.settings.status == true) {
                statusBarItemEl.setText('✅ Files are Active')
                statusBarItemEl.ariaLabel = filenames.join('\n')
            }

            //Emotes!!
            if (this.settings.emotes == true) {
                //add a emote in front of the active file and change back when its inactive
                const activeFile = this.app.workspace.getActiveFile()
                if (activeFile) {
                    const activeFilePath = activeFile.path
                    if (files.includes(activeFilePath)) {
                        //if username is in files 
                        if (this.settings.username != '') {
                            if (filenames.includes(`${this.settings.username} - ${activeFilePath}`)) {
                                return
                            }
                        }
                        //change file name
                        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
                        if (activeView) {
                            activeView.file.name = `🍁 ${activeView.file.name}`
                        }
                    }   //revert when file becomes inactive
                    else {
                        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
                        if (activeView) {
                            activeView.file.name = activeView.file.name.replace('🍁 ', '')
                        }
                    }
                }
            }

            //Notices!!
            const activeFile = this.app.workspace.getActiveFile()
            if (this.settings.notice == true) {
                if (activeFile) {
                    const activeFilePath = activeFile.path
                    if (files.includes(activeFilePath)) {
                        //if username is in files 
                        if (this.settings.username != '') {
                            if (filenames.includes(`${this.settings.username} - ${activeFilePath}`)) {
                                return
                            }
                        }
                        new Notice(this.settings.noticePrompt)
                    }

                    // if (this.settings.fileOwners == true) {
                    //     this.registerEvent(this.app.workspace.on("file-open", () => {
                    //         if (activeFile) {
                    //             this.addCommand({
                    //                 id: 'make-file-readonly',
                    //                 name: 'Make File Readonly',
                    //                 callback: () => {


                    //                 }
                    //             });
                    //         }
                    //     }));
                    // }
                }
            }
        }
        else {

            if (this.settings.status == true) {
                statusBarItemEl.setText('❌ No Files')
                statusBarItemEl.ariaLabel = '^^'
            }
        }

    }

}