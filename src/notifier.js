function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
notifier = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	_notifierID: null,
	reader: null,
	selected_anno: null,
	
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
		
		this.reader = Zotero.Reader.getByTabID(ids[0]);
		this.selected_anno = this.reader._internalReader._state.selectedAnnotationIDs;
        this.reader._window.addEventListener('focusin', async () => {
            await sleep(100);
            if (this.reader._internalReader._state.selectedAnnotationIDs !== this.selected_anno) {
                this.selected_anno = this.reader._internalReader._state.selectedAnnotationIDs;
                if (this.selected_anno.length === 0) return;
                let anno_id = Zotero.Items.getByLibraryAndKey(1, this.selected_anno)._id;
                let updates = [
                    [anno_id, true]
                ];
                await fetch(new URL("/notify", Zotero.Prefs.get('extensions.zotlit-notifier.url', true)), {
                    method: "POST",
                    body: JSON.stringify({ event: "reader/annot-select", updates }),
                    headers: { "Content-Type": "application/json" }
                });
            }
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