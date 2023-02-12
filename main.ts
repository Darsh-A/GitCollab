import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { Octokit } from 'octokit';
var cron = require('node-cron');

interface gitCollabSettings {
    checkInterval: number;
    checkTime: number;
    token: string;
    owner: string;
    repo: string;
    notice: boolean;
    noticePrompt: string;
    username: string;
    fileOwners: boolean;
    nameOwners: string;
    debugMode: boolean;

}

const DEFAULT_SETTINGS: gitCollabSettings = {
    checkInterval: 15,
    checkTime: 2,
    token: '',
    owner: '',
    repo: '',
    notice: false,
    noticePrompt: 'This file is being edited by someone else',
    username: '',
    fileOwners: false,
    nameOwners: '',
    debugMode: false,
}

export default class gitCollab extends Plugin {

    settings: gitCollabSettings;

    async onload() {

        console.log('Git-Collab Loaded!!!');

        //Load settings
        await this.loadSettings();
        this.addSettingTab(new SampleSettingTab(this.app, this));

        //Add status bar item
        const statusBarItemEl = this.addStatusBarItem()
        statusBarItemEl.setText('Loading Git-Collab.')

        //Github Authentication
        const octokit = new Octokit({
            auth: this.settings.token,
        });

        //Check if the settings are set
        if (this.settings.token == '' || this.settings.owner == '' || this.settings.repo == '') {
            statusBarItemEl.setText('❌ Settings not set.')
            statusBarItemEl.ariaLabel = 'Please check git collab settings tab.'
            return
        }

        const cronJob: String = `*/${this.settings.checkInterval} * * * * *`

        //cron job
        cron.schedule(cronJob, async () => {

            if (this.settings.debugMode){
                console.log(`Git Collab: Cron task started with a timer of ${this.settings.checkInterval}`);
            }

            const time_rn= new Date()
            const time_bf = new Date(time_rn.getTime() - this.settings.checkTime * 60000)

            if (this.settings.debugMode){
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

                commits.push(response2.data)
            }

            //If there are commits under the time interval
            if (commits.length != 0) {

                let filenames = []
                let files = []

                for (let i = 0; i < commits.length; i++) {

                    for (let j = 0; j < commits[i].files.length; j++) {
                        filenames.indexOf(`${commits[i].commit.author.name} - ${commits[i].files[j].filename}`) == -1 ? filenames.push(`${commits[i].commit.author.name} - ${commits[i].files[j].filename}`) : null
                        files.indexOf(commits[i].files[j].filename) == -1 ? files.push(commits[i].files[j].filename) : null
                    }
                }

                statusBarItemEl.setText('✅ Files are Active')
                statusBarItemEl.ariaLabel = filenames.join('\n')

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
                    }
                }

            }
            else {
                statusBarItemEl.setText('❌ No Files')
                statusBarItemEl.ariaLabel = 'No files are being editted currently.'
            }
        })
    }

    onunload() {
        if (this.settings.debugMode){
            console.log('Git Collab: Unloading Plugin')
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

}

//Settings Tab

class SampleSettingTab extends PluginSettingTab {
    plugin: gitCollab;

    constructor(app: App, plugin: gitCollab) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h1', { text: 'Git Collab Settings' });

        new Setting(containerEl)
            .setName('Github Personal Access Token')
            .setDesc('Do not commit the .obsidian/plugin/Git-Check/main.js file to Github')
            .addText(text => text
                .setValue(this.plugin.settings.token)
                .onChange(async (value) => {
                    this.plugin.settings.token = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Repository Owner')
            .setDesc('Github repository Owner Username')
            .addText(text => text
                .setValue(this.plugin.settings.owner)
                .onChange(async (value) => {
                    this.plugin.settings.owner = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Repository Name')
            .setDesc('Github repository name')
            .addText(text => text
                .setValue(this.plugin.settings.repo)
                .onChange(async (value) => {
                    this.plugin.settings.repo = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Notices!')
            .setDesc('Give Notice for active files')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notice)
                .onChange(async (value) => {
                    this.plugin.settings.notice = value;
                    await this.plugin.saveSettings();
                   }));
        
        new Setting(containerEl)
            .setName('Debug Mode')
            .setDesc('Print useful debugging messages to console.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    await this.plugin.saveSettings();
                }));
        
                new Setting(containerEl)
                .setName('Time Interval to Check for Activity (in mins)')
                .setDesc('Default: 2 minutes')
                .addText(text => text
                    .setPlaceholder('2')
                    .setValue(`${this.plugin.settings.checkTime}`)
                    .onChange(async (value) => {
                        this.plugin.settings.checkTime = Math.round(parseFloat(value));
                        await this.plugin.saveSettings();
                    }));
            new Setting(containerEl)
                .setName('Time between each check (in seconds)')
                .setDesc('Default: 15 seconds')
                .addText(text => text
                    .setPlaceholder('15')
                    .setValue(`${this.plugin.settings.checkInterval}`)
                    .onChange(async (value) => {
                        this.plugin.settings.checkInterval = Math.round(parseFloat(value));
                        await this.plugin.saveSettings();
                    }
                    ));

        containerEl.createEl('h2', { text: 'Notices Settings.' });

        if (this.plugin.settings.notice == true) {

            new Setting(containerEl)
                .setName('Notice Message')
                .setDesc('Default: This file is being edited by someone else')
                .addText(text => text
                    .setValue(this.plugin.settings.noticePrompt)
                    .onChange(async (value) => {
                        this.plugin.settings.noticePrompt = value;
                        await this.plugin.saveSettings();
                    }
                    ));

            new Setting(containerEl)
                .setName('Enter "your" Github Username')
                .setDesc('So that you dont get a notice for your own edits')
                .addText(text => text
                    .setValue(this.plugin.settings.username)
                    .onChange(async (value) => {
                        this.plugin.settings.username = value;
                        await this.plugin.saveSettings();
                    }
                    ));

            new Setting(containerEl)
                .setName('Enable Ownerships')
                .setDesc('Set owners of certain folders who grant access to edit those files')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.fileOwners)
                    .onChange(async (value) => {
                        this.plugin.settings.fileOwners = value;
                        await this.plugin.saveSettings();
                    }
                    ));

            if (this.plugin.settings.fileOwners == true) {

                new Setting(containerEl)
                    .setName('Owners')
                    .setDesc('Enter the owners of the files in the format "owner:foldername" and seperate them by a comma. Example: "owner1:folder1,owner2:folder2"')
                    .addTextArea(text => text
                        .setValue(this.plugin.settings.nameOwners)
                        .onChange(async (value) => {
                            this.plugin.settings.nameOwners = value;
                            await this.plugin.saveSettings();
                        }
                        ));
            }
        }

    }
}