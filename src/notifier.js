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
	_eventListeners: new Map(),
	
	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
	},
	
	log(msg) {
		Zotero.debug("zotlit-notifier: " + msg);
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
		try {
			await fetch(new URL("/notify", Zotero.Prefs.get('extensions.zotlit-notifier.url', true)), {
				method: "POST",
				body: JSON.stringify({event: "reader/active", itemId, attachmentId}),
				headers: {"Content-Type": "application/json"},
			});
		} catch (error) {
			this.log('Failed to notify server: ' + error.message);
		}
		
		this.reader = Zotero.Reader.getByTabID(ids[0]);
		this.selected_anno = this.reader._internalReader._state.selectedAnnotationIDs;
		
		// Remove existing listener for this window if it exists
		if (this._eventListeners.has(this.reader._window)) {
			const oldListener = this._eventListeners.get(this.reader._window);
			this.reader._window.removeEventListener('focusin', oldListener);
		}
		
		// Create new listener
		const focusListener = async () => {
            await sleep(100);
            if (this.reader && this.reader._internalReader && this.reader._internalReader._state.selectedAnnotationIDs !== this.selected_anno) {
                this.selected_anno = this.reader._internalReader._state.selectedAnnotationIDs;
                if (this.selected_anno.length === 0) return;
                let anno_id = Zotero.Items.getByLibraryAndKey(1, this.selected_anno)._id;
                let updates = [
                    [anno_id, true]
                ];
                try {
                    await fetch(new URL("/notify", Zotero.Prefs.get('extensions.zotlit-notifier.url', true)), {
                        method: "POST",
                        body: JSON.stringify({ event: "reader/annot-select", updates }),
                        headers: { "Content-Type": "application/json" }
                    });
                } catch (error) {
                    this.log('Failed to notify server about annotation selection: ' + error.message);
                }
            }
        };
        
        // Add new listener and store reference
        this.reader._window.addEventListener('focusin', focusListener);
        this._eventListeners.set(this.reader._window, focusListener);

	},
	
	cleanup() {
		this.log('Cleaning up event listeners');
		// Remove all event listeners
		for (const [window, listener] of this._eventListeners) {
			try {
				window.removeEventListener('focusin', listener);
			} catch (error) {
				this.log('Error removing event listener: ' + error.message);
			}
		}
		this._eventListeners.clear();
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
