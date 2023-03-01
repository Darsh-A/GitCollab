import { App, Modal} from "obsidian";
import { Octokit } from "octokit";
import { fetchCommits } from "src/gitFunctions";
import { gitCollabSettings } from "src/Interfaces/gitCollabSettings";

export class CommitsModal extends Modal {
  Octokit: Octokit;
  settings: gitCollabSettings;

  constructor(app: App, Octokit: Octokit, settings: gitCollabSettings) {
    super(app);
    this.Octokit = Octokit;
    this.settings = settings;
  }

  async onOpen() {

    let { contentEl, titleEl } = this;

    titleEl.createEl("div", { text: "Git-Collab", attr: { style: this.settings.ribbonModalTitleCSS } });
    contentEl.createEl("div", { text: `Fetching commits in the past ${this.settings.ribbonCheckInterval} minutes.`, attr: { style: this.settings.ribbonModalFetchingCommitsCSS } });

    if (this.settings.ribbonCheckInterval > 60) {
      contentEl.createEl("div", { text: `This may take a while....`, attr: { style: this.settings.ribbonModalFetchingCommitsCSS } });
    }

    const editorMap = await this.convertToEditorMap();
    contentEl.empty();

    if (editorMap.size == 0) {
      contentEl.createEl("div", { text: this.settings.ribbonModalNoCommitsText, attr: { style: this.settings.ribbonModalNoCommitsCSS } });
      return;
    }

    for (var [key, value] of editorMap.entries()) {
        
        const authorEl = contentEl.createEl("strong", { text: key, attr: { style: this.settings.ribbonModalAuthorCSS } });
  
        for (var i = 0; i < value.length; i++) {
        const file =authorEl.createEl("ol", { text: value[i].get('fileName'), attr: { style: this.settings.ribbonModalFileNameCSS } });
        file.createEl("nav", { text: value[i].get('filePath'), attr: { style: this.settings.ribbonModalFilePathCSS } });
        }
    }
  }

  private async convertToEditorMap() {

    const fileMap = await fetchCommits(this.Octokit, this.settings, this.settings.ribbonCheckInterval);
    const authors: string[] = Array.from(new Set(Object.values(fileMap)));

    const editorMap = new Map();
    authors.forEach( author=> {
      editorMap.set(author, []);
    });

    for (var i = 0; i < authors.length; i++) {
      for (var [key, value] of Object.entries(fileMap)) {
        if (value == authors[i]) {

          const detailsMap = new Map();
          detailsMap.set('filePath', key);
          detailsMap.set('fileName', key.split('/').pop()?.split('.')[0]);
          editorMap.get(authors[i]).push(detailsMap);
        }
      }
    }

    return editorMap;
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}