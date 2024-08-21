notifier = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	_notifierID: null,
	
	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
	},
	
	log(msg) {
		Zotero.debug("zoteropreview: " + msg);
	},
	
	async main() {
		this.log('adding notifier');
		this._notifierID = Zotero.Notifier.registerObserver(this, 'tab', 'zotlit-notifier');
		this.log(this._notifierID);
		
		// Retrieve a global pref
		this.log(`Main: Server is ${Zotero.Prefs.get('extensions.zotlit-notifier.url', true)}`);

	},

	// the way this works is that you register with the Zotero Notifier, which then calls the "notify" function
	async notify(event, _type, ids, extraData) {
		this.log(event)
		if (event != 'select' || ids[0] == 'zotero-pane') {
			return;
		}
		let item = Zotero.Reader.getByTabID(ids[0])._item
		let itemId = item._parentID
		let attachmentId = item._id
		await fetch(new URL("/notify", Zotero.Prefs.get('extensions.zotlit-notifier.url', true)), {
			method: "POST",
			body: JSON.stringify({event: "reader/active", itemId, attachmentId}),
			headers: {"Content-Type": "application/json"},
		});
	},
}


//can run in zotero developer javascript window
//observerId = Zotero.Notifier.registerObserver({notify: async () => {
//		let item = Zotero.Reader.getByTabID(Zotero_Tabs._selectedID)._item
//		let itemId = item._parentID
//		let attachmentId = item._id
//		await notify({event: "reader/active", itemId, attachmentId})
//	}}, 'tab', 'zotlit-notifier');
//	
//Zotero.log(observerId) //dont forget to deregister
//async function notify(content) {
//	try {
//		await fetch(new URL("/notify", Zotero.Prefs.get('extensions.zotlit-notifier.url', true)), {
//			method: "POST",
//			body: JSON.stringify(content),
//			headers: {"Content-Type": "application/json"},
//		});
//	} catch (error) {
//		console.log('failed to notify');
//		throw error;
//	}
//}