import {App, PluginSettingTab, Setting} from 'obsidian';
import gitCollab from 'src/main';

//Settings Tab

export class gitCollabSettingTab extends PluginSettingTab {
    plugin: gitCollab;

    constructor(app: App, plugin: gitCollab) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {

        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h1', { text: 'Settings for Git-Collab' });

        if (this.plugin.settings.status == false && this.plugin.settings.notice == false) {
            containerEl.createEl('h3', { text: 'Please enable the status bar and/or the notice' })
        }

        //Required Settings
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
                }
                ));
        
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
        }));

        //Optional Settings

        //Filename
        new Setting(containerEl)
            .setName('Active File Emotes')
            .setDesc('Show Emotes for active files')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.emotes)
                .onChange(async (value) => {
                    this.plugin.settings.emotes = value;
                    await this.plugin.saveSettings();
        }));

        //Notice when someone opens the active file
        new Setting(containerEl)
            .setName('Notices!')
            .setDesc('Give Notice for active files')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.notice)
                .onChange(async (value) => {
                    this.plugin.settings.notice = value;
                    await this.plugin.saveSettings();
                    this.display();
        }));

        //add status to the status bar
            new Setting(containerEl)
                .setName('Status Bar')
                .setDesc('Show Status of active files in the status bar')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.status)
                    .onChange(async (value) => {
                        this.plugin.settings.status = value;
                        await this.plugin.saveSettings();
                        this.display();
            }));
        
            new Setting(containerEl)
                .setName('Debug Mode')
                .setDesc('Print useful debugging messages to console.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.debugMode)
                    .onChange(async (value) => {
                        this.plugin.settings.debugMode = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

        if (this.plugin.settings.notice == true) {

            containerEl.createEl('h4', { text: 'Notices Settings' });

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
                        this.display();
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

        if (this.plugin.settings.debugMode) {

            containerEl.createEl('h4', { text: 'Debug Settings' });

            new Setting(containerEl)
                .setName('Cron Timer Debug')
                .setDesc('Log Cron Task Running Timer')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.cronDebugLogger)
                    .onChange(async (value) => {
                        this.plugin.settings.cronDebugLogger = value;
                        await this.plugin.saveSettings();
                    }));
            
            new Setting(containerEl)
                .setName('Git Commit Debug')
                .setDesc('Log Git Commit Messages')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.commitDebugLogger)
                    .onChange(async (value) => {
                        this.plugin.settings.commitDebugLogger = value;
                        await this.plugin.saveSettings();
                    }));
        }

    }
}