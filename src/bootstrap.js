var notifier;

function log(msg) {
	Zotero.log("Custom Zotlit Notifier: " + msg);
}

function install() {
	log("Installed");
}

async function startup({ id, version, rootURI }) {
	log("Starting " + version);
	
	Services.scriptloader.loadSubScript(rootURI + 'notifier.js');
	
	Zotero.PreferencePanes.register({
		pluginID: 'zotlit-notifier@faibk.github.io',
		src: rootURI + 'preferences.xhtml',
		label: 'Custom Zotlit Notifier'
	});
	
	notifier.init({ id, version, rootURI});
	
	await notifier.main();
}

function shutdown() {
	log("Shutting down");
	Zotero.Notifier.unregisterObserver(this._notifierID);
}

function uninstall() {
	log("Uninstalled");
}