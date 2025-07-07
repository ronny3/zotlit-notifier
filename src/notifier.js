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

	// Helper function to safely get selected annotation IDs with retry logic
	async getSelectedAnnotationIDs(reader, maxRetries = 5, delay = 50) {
		for (let i = 0; i < maxRetries; i++) {
			try {
				if (reader && reader._internalReader && reader._internalReader._state) {
					return reader._internalReader._state.selectedAnnotationIDs;
				}
			} catch (error) {
				this.log(`Attempt ${i + 1} to get selectedAnnotationIDs failed: ${error.message}`);
			}
			
			if (i < maxRetries - 1) {
				await sleep(delay);
				delay *= 2; // Exponential backoff
			}
		}
		
		this.log('Failed to get selectedAnnotationIDs after all retries, returning empty array');
		return [];
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
		
		// Safely get selected annotation IDs with retry logic
		this.selected_anno = await this.getSelectedAnnotationIDs(this.reader);
		
		// Remove existing listener for this window if it exists
		if (this.reader._window && this._eventListeners.has(this.reader._window)) {
			const oldListener = this._eventListeners.get(this.reader._window);
			this.reader._window.removeEventListener('focusin', oldListener);
		}
		
		// Create new listener
		const focusListener = async () => {
            await sleep(100);
            
            // Safely check for reader and internal reader availability
            if (!this.reader || !this.reader._internalReader) {
                this.log('Reader or internal reader not available in focus listener');
                return;
            }
            
            try {
                const currentSelectedAnnotations = await this.getSelectedAnnotationIDs(this.reader);
                
                if (JSON.stringify(currentSelectedAnnotations) !== JSON.stringify(this.selected_anno)) {
                    this.selected_anno = currentSelectedAnnotations;
                    
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
            } catch (error) {
                this.log('Error in focus listener: ' + error.message);
            }
        };
        
        // Add new listener and store reference only if window is available
        if (this.reader._window) {
            this.reader._window.addEventListener('focusin', focusListener);
            this._eventListeners.set(this.reader._window, focusListener);
        } else {
            this.log('Reader window not available, skipping event listener setup');
        }

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
