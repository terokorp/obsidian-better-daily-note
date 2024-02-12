import { App, Editor, MarkdownView, Menu, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, moment } from 'obsidian';

// Remember to rename these classes and interfaces!
interface BetterDailyNotesSettings {
	dateFormat: string;
	templateFolder: string;
}

const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
	dateFormat: 'YYYY-MM-DD',
	templateFolder: ''
}

export default class BetterDailyNotesPlugin extends Plugin {
	settings: BetterDailyNotesSettings;

	async onload() {
		console.log("Loading plugin BetterDailyNotes");
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('pencil', 'Create new daily note to current folder', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.CreateNewNote();
		});
		
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		//const statusBarItemEl = this.addStatusBarItem();
		//statusBarItemEl.setText('Status Bar Text');

		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new BetterDailyNotesSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file, source) => {
                this.handleFileMenu(menu, file, source);
            })
        );
	}

	handleFileMenu(menu: Menu, file: TAbstractFile, source: string): void {
		if (source !== "file-explorer-context-menu" || !file) {
            return;
        }
		console.log(file);
		menu.addItem((item) => {
            item.setTitle(`New daily note`)
                .setIcon("calendar-fold")
                .setSection("action-primary")
                .onClick((_) => {
                    this.CreateNewNote(file.path);
                })});
	}
	
	// Creating new note
	CreateNewNote(folder : string | null = null) {
		var fileName = this.GenerateNewFilename(folder);
		console.log("CreateNewNote" + fileName);
	
		// Checking if file already exist
		console.log(this.app.vault.getAbstractFileByPath(fileName));
		const fileExists = this.app.vault.getAbstractFileByPath(fileName) !== null;
		if(!fileExists)
		{
			// Creating new file
			this.app.vault.create(fileName, '', {}).then(() => {
				// Opening newly created file
				this.app.workspace.openLinkText(fileName, '');
			})
		}
		else {
			// Opening existing file
			this.app.workspace.openLinkText(fileName, '');
		}
	}

	GenerateNewFilename(folder: string | null = null) {
		var basePath = "";

		if(folder !== null) {
			basePath = folder;
		}
		else
		{
			// Getting currently active file
			var activeNoteFile = this.app.workspace.activeEditor?.file?.path;
			if(activeNoteFile == null) {
				activeNoteFile = "";
			}

			// Getting path from active file
			basePath = this.app.fileManager.getNewFileParent(activeNoteFile).path;
		}

		// Generating filename
		var fileName= moment().format(this.settings.dateFormat);
		console.log(basePath);
		if(basePath.length <= 1) {
			return `/${fileName}.md`;
		}
		else {
			return `${basePath}/${fileName}.md`;
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class BetterDailyNotesSettingTab extends PluginSettingTab {
	plugin: BetterDailyNotesPlugin;

	constructor(app: App, plugin: BetterDailyNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Date format')
			.setDesc('Syntax ref: [format reference](https://momentjs.com/docs/#/displaying/format/)')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

		// new Setting(containerEl)
		// 	.setName('Template file location')
		// 	.addText(text => text.setPlaceholder('Example: folder/note')
		// 		.setValue(this.plugin.settings.templateFolder)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.templateFolder = value;
		// 			await this.plugin.saveSettings();
		// 		}));
	}
}
