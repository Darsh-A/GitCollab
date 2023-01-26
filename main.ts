import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { Octokit } from 'octokit';
var cron = require('node-cron');

interface gitCollabSettings {
    // interval: string;
    // check: string;
    token: string;
    owner: string;
    repo: string;
    notice: boolean;
    notice1: string;
    username: string;
    fileOwners: boolean;
    nameOwners: string;

}

const DEFAULT_SETTINGS: gitCollabSettings = {
    // interval: '',
    // check: '',
    token: '',
    owner: '',
    repo: '',
    notice: false,
    notice1: 'File has been edited recently!!!\nCheck the status bar uwu',
    username: '',
    fileOwners: false,
    nameOwners: '',
}

export default class gitCollab extends Plugin {

    settings: gitCollabSettings;

    workspace: any;


    async onload() {

        console.log('Git-Collab Loaded!!! ^^');

        //Load settings
        await this.loadSettings();
        this.addSettingTab(new gitCollabSettingTab(this.app, this));

        //Add status bar item
        const statusBarItemEl = this.addStatusBarItem()
        statusBarItemEl.setText('Loading...')

        //Github Authentication
        const octokit = new Octokit({
            auth: this.settings.token,
        });

        //Check if the settings are set
        if (this.settings.token == '' || this.settings.owner == '' || this.settings.repo == '') {
            statusBarItemEl.setText('❌ Settings not set')
            statusBarItemEl.ariaLabel = '^^'
            return
        }
        //cron job
        cron.schedule(`*/15 * * * * *`, async () => {
            console.log('cron launched')

            const time_rn = new Date()
            const time_bf = new Date(time_rn.getTime() - 2 * 60000)

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

            //get all commits under the time interval
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

                let filenames : string[] = []
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
                            new Notice(this.settings.notice1)
                        }

                        if (this.settings.fileOwners == true) {
                            this.registerEvent(this.app.workspace.on("file-open", () => {
                                if (activeFile) {
                                    this.addCommand({
                                        id: 'make-file-readonly',
                                        name: 'Make File Readonly',
                                        callback: () => {
                                            if (filenames.includes(`${this.settings.username} - ${activeFilePath}`)) {
                                                if (!filenames.includes(`${this.settings.username} - ${activeFilePath}`)) {
                                                    // @ts-ignore: Object is possibly 'null'.
                                                    this.app.workspace.getActiveViewOfType(MarkdownView).setReadOnly(true);
                                                }
                                                // @ts-ignore: Object is possibly 'null'.
                                                this.app.workspace.getActiveViewOfType(MarkdownView).setReadOnly(false);
                                            }
                                            else {
                                                new Notice('You are not currently working on this file :(');
                                            }
                                        }
                                    });
                                }
                            }));
                        }
                    }
                }
            }
            else {
                statusBarItemEl.setText('❌ No Files')
                statusBarItemEl.ariaLabel = '^^'
            }
        })
    }

    onunload() {
        console.log('unloading plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

}

//Settings Tab

class gitCollabSettingTab extends PluginSettingTab {
    plugin: gitCollab;

    constructor(app: App, plugin: gitCollab) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();;

        containerEl.createEl('h1', { text: 'Settings for Git-Collab! :3.' });

        new Setting(containerEl)
            .setName('Github Personal Access Token')
            .setDesc('Do not commit the .obsidian/plugin/Git-Check/main.js file to Github')
            .addText(text => text
                .setValue(this.plugin.settings.token)
                .onChange(async (value) => {
                    this.plugin.settings.token = value;
                    await this.plugin.saveSettings();
                }
                ));

        new Setting(containerEl)
            .setName('Repository Owner')
            .setDesc('Github repository Owner Username')
            .addText(text => text
                .setValue(this.plugin.settings.owner)
                .onChange(async (value) => {
                    this.plugin.settings.owner = value;
                    await this.plugin.saveSettings();
                }
                ));
        new Setting(containerEl)
            .setName('Repository Name')
            .setDesc('Github repository name')
            .addText(text => text
                .setValue(this.plugin.settings.repo)
                .onChange(async (value) => {
                    this.plugin.settings.repo = value;
                    await this.plugin.saveSettings();
                }
                ));
        new Setting(containerEl)
            .setName('Notices!')
            .setDesc('Give Notice for active files')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notice)
                .onChange(async (value) => {
                    this.plugin.settings.notice = value;
                    await this.plugin.saveSettings();
                })

            );


        containerEl.createEl('h2', { text: 'Notices Settings.' });

        if (this.plugin.settings.notice == true) {

            new Setting(containerEl)
                .setName('Notice Message')
                .setDesc('Default: This file is being edited by someone else')
                .addText(text => text
                    .setValue(this.plugin.settings.notice1)
                    .onChange(async (value) => {
                        this.plugin.settings.notice1 = value;
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
                .setDesc('set owners of certain folders who grant access to edit those files')
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
        // new Setting(containerEl)
        //     .setName('Time Interval to Check for Activity (in mins)')
        //     .setDesc('Default: 2 minutes')
        //     .addText(text => text
        //         .setPlaceholder('2')
        //         .setValue(this.plugin.settings.interval)
        //         .onChange(async (value) => {
        //             this.plugin.settings.interval = value;
        //             await this.plugin.saveSettings();
        //         }));
        // new Setting(containerEl)
        //     .setName('Time between each check (in seconds)')
        //     .setDesc('Default: 15 seconds')
        //     .addText(text => text
        //         .setPlaceholder('15')
        //         .setValue(this.plugin.settings.check)
        //         .onChange(async (value) => {
        //             this.plugin.settings.check = value;
        //             await this.plugin.saveSettings();
        //         }
        //         ));

    }
}