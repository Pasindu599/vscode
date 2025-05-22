/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// import { CancellationToken } from '../../../../../base/common/cancellation.js';
import { Codicon } from '../../../../../base/common/codicons.js';
import { KeyCode, KeyMod } from '../../../../../base/common/keyCodes.js';
import { basename } from '../../../../../base/common/resources.js';
import { URI } from '../../../../../base/common/uri.js';
import { isCodeEditor } from '../../../../../editor/browser/editorBrowser.js';
import { ServicesAccessor } from '../../../../../editor/browser/editorExtensions.js';
// import { Position } from '../../../../../editor/common/core/position.js';
// import { EditorContextKeys } from '../../../../../editor/common/editorContextKeys.js';
// import { isLocation, Location } from '../../../../../editor/common/languages.js';
// import { ITextModel } from '../../../../../editor/common/model.js';
// import { ILanguageFeaturesService } from '../../../../../editor/common/services/languageFeatures.js';
// import { ITextModelService } from '../../../../../editor/common/services/resolverService.js';
import { localize, localize2 } from '../../../../../nls.js';
import { Action2, MenuId, registerAction2 } from '../../../../../platform/actions/common/actions.js';
// import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { ContextKeyExpr } from '../../../../../platform/contextkey/common/contextkey.js';
import { IDialogService } from '../../../../../platform/dialogs/common/dialogs.js';
import { EditorActivation } from '../../../../../platform/editor/common/editor.js';
import { KeybindingWeight } from '../../../../../platform/keybinding/common/keybindingsRegistry.js';
import { IListService } from '../../../../../platform/list/browser/listService.js';
import { GroupsOrder, IEditorGroupsService } from '../../../../services/editor/common/editorGroupsService.js';
import { IEditorService } from '../../../../services/editor/common/editorService.js';
import { isChatViewTitleActionContext } from '../../common/chatActions.js';
import { ChatContextKeys } from '../../common/chatContextKeys.js';
import { applyingChatEditsFailedContextKey, CHAT_EDITING_MULTI_DIFF_SOURCE_RESOLVER_SCHEME, chatEditingResourceContextKey, chatEditingWidgetFileStateContextKey, decidedChatEditingResourceContextKey, hasAppliedChatEditsContextKey, hasUndecidedChatEditingResourceContextKey, IChatEditingService, IChatEditingSession, WorkingSetEntryRemovalReason, WorkingSetEntryState } from '../../common/chatEditingService.js';
import { IChatService } from '../../common/chatService.js';
// import { isRequestVM, isResponseVM } from '../../common/chatViewModel.js';
import { ChatAgentLocation } from '../../common/constants.js';
// import { CHAT_CATEGORY } from '../actions/chatActions.js';
import { IChatWidget, IChatWidgetService } from '../chat.js';

export abstract class EditingSessionAction extends Action2 {

	run(accessor: ServicesAccessor, ...args: any[]) {
		const context = getEditingSessionContext(accessor, args);
		if (!context || !context.editingSession) {
			return;
		}

		return this.runEditingSessionAction(accessor, context.editingSession, context.chatWidget, ...args);
	}

	abstract runEditingSessionAction(accessor: ServicesAccessor, editingSession: IChatEditingSession, chatWidget: IChatWidget, ...args: any[]): any;
}

export function getEditingSessionContext(accessor: ServicesAccessor, args: any[]): { editingSession?: IChatEditingSession; chatWidget: IChatWidget } | undefined {
	const arg0 = args.at(0);
	const context = isChatViewTitleActionContext(arg0) ? arg0 : undefined;

	const chatService = accessor.get(IChatService);
	const chatWidgetService = accessor.get(IChatWidgetService);
	const chatEditingService = accessor.get(IChatEditingService);
	let chatWidget = context ? chatWidgetService.getWidgetBySessionId(context.sessionId) : undefined;
	if (!chatWidget) {
		if (chatService.unifiedViewEnabled) {
			// TODO ugly
			chatWidget = chatWidgetService.getWidgetsByLocations(ChatAgentLocation.Panel).find(w => w.isUnifiedPanelWidget);
		} else {
			chatWidget = chatWidgetService.getWidgetsByLocations(ChatAgentLocation.EditingSession).at(0);
		}
	}

	if (!chatWidget?.viewModel) {
		return;
	}

	const chatSessionId = chatWidget.viewModel.model.sessionId;
	const editingSession = chatEditingService.getEditingSession(chatSessionId);

	if (!editingSession) {
		return;
	}

	return { editingSession, chatWidget };
}


abstract class WorkingSetAction extends EditingSessionAction {

	runEditingSessionAction(accessor: ServicesAccessor, editingSession: IChatEditingSession, chatWidget: IChatWidget, ...args: any[]) {

		const uris: URI[] = [];
		if (URI.isUri(args[0])) {
			uris.push(args[0]);
		} else if (chatWidget) {
			uris.push(...chatWidget.input.selectedElements);
		}
		if (!uris.length) {
			return;
		}

		return this.runWorkingSetAction(accessor, editingSession, chatWidget, ...uris);
	}

	abstract runWorkingSetAction(accessor: ServicesAccessor, editingSession: IChatEditingSession, chatWidget: IChatWidget | undefined, ...uris: URI[]): any;
}

registerAction2(class RemoveFileFromWorkingSet extends WorkingSetAction {
	constructor() {
		super({
			id: 'chatEditing.removeFileFromWorkingSet',
			title: localize2('removeFileFromWorkingSet', 'Remove File'),
			icon: Codicon.close,
			precondition: ChatContextKeys.requestInProgress.negate(),
			menu: [{
				id: MenuId.ChatEditingWidgetModifiedFilesToolbar,
				// when: ContextKeyExpr.or(ContextKeyExpr.equals(chatEditingWidgetFileStateContextKey.key, WorkingSetEntryState.Attached), ContextKeyExpr.equals(chatEditingWidgetFileStateContextKey.key, WorkingSetEntryState.Suggested), ContextKeyExpr.equals(chatEditingWidgetFileStateContextKey.key, WorkingSetEntryState.Transient)),
				order: 5,
				group: 'navigation'
			}],
		});
	}

	async runWorkingSetAction(accessor: ServicesAccessor, currentEditingSession: IChatEditingSession, chatWidget: IChatWidget, ...uris: URI[]): Promise<void> {
		const dialogService = accessor.get(IDialogService);

		const pendingEntries = currentEditingSession.entries.get().filter((entry) => uris.includes(entry.modifiedURI) && entry.state.get() === WorkingSetEntryState.Modified);
		if (pendingEntries.length > 0) {
			// Ask for confirmation if there are any pending edits
			const file = pendingEntries.length > 1
				? localize('chat.editing.removeFile.confirmationmanyFiles', "{0} files", pendingEntries.length)
				: basename(pendingEntries[0].modifiedURI);
			const confirmation = await dialogService.confirm({
				title: localize('chat.editing.removeFile.confirmation.title', "Remove {0} from working set?", file),
				message: localize('chat.editing.removeFile.confirmation.message', "This will remove {0} from your working set and undo the edits made to it. Do you want to proceed?", file),
				primaryButton: localize('chat.editing.removeFile.confirmation.primaryButton', "Yes"),
				type: 'info'
			});
			if (!confirmation.confirmed) {
				return;
			}
		}

		// Remove from working set
		await currentEditingSession.reject(...uris);
		currentEditingSession.remove(WorkingSetEntryRemovalReason.User, ...uris);

		// Remove from chat input part
		for (const uri of uris) {
			chatWidget.attachmentModel.delete(uri.toString());
		}

		// Clear all related file suggestions
		if (chatWidget.attachmentModel.fileAttachments.length === 0) {
			chatWidget.input.relatedFiles?.clear();
		}
	}
});

registerAction2(class OpenFileInDiffAction extends WorkingSetAction {
	constructor() {
		super({
			id: 'chatEditing.openFileInDiff',
			title: localize2('open.fileInDiff', 'Open Changes in Diff Editor'),
			icon: Codicon.diffSingle,
			menu: [{
				id: MenuId.ChatEditingWidgetModifiedFilesToolbar,
				when: ContextKeyExpr.equals(chatEditingWidgetFileStateContextKey.key, WorkingSetEntryState.Modified),
				order: 2,
				group: 'navigation'
			}],
		});
	}

	async runWorkingSetAction(accessor: ServicesAccessor, currentEditingSession: IChatEditingSession, _chatWidget: IChatWidget, ...uris: URI[]): Promise<void> {
		const editorService = accessor.get(IEditorService);
		for (const uri of uris) {
			const editedFile = currentEditingSession.getEntry(uri);
			if (editedFile?.state.get() === WorkingSetEntryState.Modified) {
				await editorService.openEditor({
					original: { resource: URI.from(editedFile.originalURI, true) },
					modified: { resource: URI.from(editedFile.modifiedURI, true) },
				});
			} else {
				await editorService.openEditor({ resource: uri });
			}
		}
	}
});

registerAction2(class AcceptAction extends WorkingSetAction {
	constructor() {
		super({
			id: 'chatEditing.acceptFile',
			title: localize2('accept.file', 'Keep'),
			icon: Codicon.check,
			precondition: ChatContextKeys.requestInProgress.negate(),
			menu: [{
				when: ContextKeyExpr.and(ContextKeyExpr.equals('resourceScheme', CHAT_EDITING_MULTI_DIFF_SOURCE_RESOLVER_SCHEME), ContextKeyExpr.notIn(chatEditingResourceContextKey.key, decidedChatEditingResourceContextKey.key)),
				id: MenuId.MultiDiffEditorFileToolbar,
				order: 0,
				group: 'navigation',
			}, {
				id: MenuId.ChatEditingWidgetModifiedFilesToolbar,
				when: ContextKeyExpr.equals(chatEditingWidgetFileStateContextKey.key, WorkingSetEntryState.Modified),
				order: 0,
				group: 'navigation'
			}],
		});
	}

	async runWorkingSetAction(accessor: ServicesAccessor, currentEditingSession: IChatEditingSession, chatWidget: IChatWidget, ...uris: URI[]): Promise<void> {
		await currentEditingSession.accept(...uris);
	}
});

registerAction2(class DiscardAction extends WorkingSetAction {
	constructor() {
		super({
			id: 'chatEditing.discardFile',
			title: localize2('discard.file', 'Undo'),
			icon: Codicon.discard,
			precondition: ChatContextKeys.requestInProgress.negate(),
			menu: [{
				when: ContextKeyExpr.and(ContextKeyExpr.equals('resourceScheme', CHAT_EDITING_MULTI_DIFF_SOURCE_RESOLVER_SCHEME), ContextKeyExpr.notIn(chatEditingResourceContextKey.key, decidedChatEditingResourceContextKey.key)),
				id: MenuId.MultiDiffEditorFileToolbar,
				order: 2,
				group: 'navigation',
			}, {
				id: MenuId.ChatEditingWidgetModifiedFilesToolbar,
				when: ContextKeyExpr.equals(chatEditingWidgetFileStateContextKey.key, WorkingSetEntryState.Modified),
				order: 1,
				group: 'navigation'
			}],
		});
	}

	async runWorkingSetAction(accessor: ServicesAccessor, currentEditingSession: IChatEditingSession, chatWidget: IChatWidget, ...uris: URI[]): Promise<void> {
		await currentEditingSession.reject(...uris);
	}
});

export class ChatEditingAcceptAllAction extends EditingSessionAction {

	constructor() {
		super({
			id: 'chatEditing.acceptAllFiles',
			title: localize('accept', 'Keep'),
			icon: Codicon.check,
			tooltip: localize('acceptAllEdits', 'Keep All Edits'),
			precondition: ContextKeyExpr.and(ChatContextKeys.requestInProgress.negate(), hasUndecidedChatEditingResourceContextKey),
			keybinding: {
				primary: KeyMod.CtrlCmd | KeyCode.Enter,
				when: ContextKeyExpr.and(ChatContextKeys.requestInProgress.negate(), hasUndecidedChatEditingResourceContextKey, ChatContextKeys.inChatInput),
				weight: KeybindingWeight.WorkbenchContrib,
			},
			menu: [

				{
					id: MenuId.ChatEditingWidgetToolbar,
					group: 'navigation',
					order: 0,
					when: ContextKeyExpr.and(applyingChatEditsFailedContextKey.negate(), ContextKeyExpr.and(hasUndecidedChatEditingResourceContextKey))
				}
			]
		});
	}

	override async runEditingSessionAction(accessor: ServicesAccessor, editingSession: IChatEditingSession, chatWidget: IChatWidget, ...args: any[]) {
		await editingSession.accept();
	}
}
registerAction2(ChatEditingAcceptAllAction);

export class ChatEditingDiscardAllAction extends EditingSessionAction {

	constructor() {
		super({
			id: 'chatEditing.discardAllFiles',
			title: localize('discard', 'Undo'),
			icon: Codicon.discard,
			tooltip: localize('discardAllEdits', 'Undo All Edits'),
			precondition: ContextKeyExpr.and(ChatContextKeys.requestInProgress.negate(), hasUndecidedChatEditingResourceContextKey),
			menu: [
				{
					id: MenuId.ChatEditingWidgetToolbar,
					group: 'navigation',
					order: 1,
					when: ContextKeyExpr.and(applyingChatEditsFailedContextKey.negate(), hasUndecidedChatEditingResourceContextKey)
				}
			],
			keybinding: {
				when: ContextKeyExpr.and(ChatContextKeys.requestInProgress.negate(), hasUndecidedChatEditingResourceContextKey, ChatContextKeys.inChatInput, ChatContextKeys.inputHasText.negate()),
				weight: KeybindingWeight.WorkbenchContrib,
				primary: KeyMod.CtrlCmd | KeyCode.Backspace,
			},
		});
	}

	override async runEditingSessionAction(accessor: ServicesAccessor, editingSession: IChatEditingSession, chatWidget: IChatWidget, ...args: any[]) {
		await discardAllEditsWithConfirmation(accessor, editingSession);
	}
}
registerAction2(ChatEditingDiscardAllAction);

export async function discardAllEditsWithConfirmation(accessor: ServicesAccessor, currentEditingSession: IChatEditingSession): Promise<boolean> {

	const dialogService = accessor.get(IDialogService);

	// Ask for confirmation if there are any edits
	const entries = currentEditingSession.entries.get();
	if (entries.length > 0) {
		const confirmation = await dialogService.confirm({
			title: localize('chat.editing.discardAll.confirmation.title', "Undo all edits?"),
			message: entries.length === 1
				? localize('chat.editing.discardAll.confirmation.oneFile', "This will undo changes made by {0} in {1}. Do you want to proceed?", 'Copilot Edits', basename(entries[0].modifiedURI))
				: localize('chat.editing.discardAll.confirmation.manyFiles', "This will undo changes made by {0} in {1} files. Do you want to proceed?", 'Copilot Edits', entries.length),
			primaryButton: localize('chat.editing.discardAll.confirmation.primaryButton', "Yes"),
			type: 'info'
		});
		if (!confirmation.confirmed) {
			return false;
		}
	}

	await currentEditingSession.reject();
	return true;
}

export class ChatEditingRemoveAllFilesAction extends EditingSessionAction {
	static readonly ID = 'chatEditing.clearWorkingSet';

	constructor() {
		super({
			id: ChatEditingRemoveAllFilesAction.ID,
			title: localize('clearWorkingSet', 'Clear Working Set'),
			icon: Codicon.clearAll,
			tooltip: localize('clearWorkingSet', 'Clear Working Set'),
			precondition: ContextKeyExpr.and(ChatContextKeys.requestInProgress.negate()),
			menu: [
				{
					id: MenuId.ChatEditingWidgetToolbar,
					group: 'navigation',
					order: 5,
					when: hasAppliedChatEditsContextKey.negate()
				}
			]
		});
	}

	override async runEditingSessionAction(accessor: ServicesAccessor, editingSession: IChatEditingSession, chatWidget: IChatWidget, ...args: any[]): Promise<void> {
		// Remove all files from working set
		const uris = [...editingSession.entries.get()].map((e) => e.modifiedURI);
		editingSession.remove(WorkingSetEntryRemovalReason.User, ...uris);

		// Remove all file attachments
		const fileAttachments = chatWidget.attachmentModel ? chatWidget.attachmentModel.fileAttachments : [];
		const attachmentIdsToRemove = fileAttachments.map(attachment => attachment.toString());
		chatWidget.attachmentModel.delete(...attachmentIdsToRemove);
	}
}
registerAction2(ChatEditingRemoveAllFilesAction);

export class ChatEditingShowChangesAction extends EditingSessionAction {
	static readonly ID = 'chatEditing.viewChanges';
	static readonly LABEL = localize('chatEditing.viewChanges', 'View All Edits');

	constructor() {
		super({
			id: ChatEditingShowChangesAction.ID,
			title: ChatEditingShowChangesAction.LABEL,
			tooltip: ChatEditingShowChangesAction.LABEL,
			f1: false,
			icon: Codicon.diffMultiple,
			precondition: hasUndecidedChatEditingResourceContextKey,
			menu: [
				{
					id: MenuId.ChatEditingWidgetToolbar,
					group: 'navigation',
					order: 4,
					when: ContextKeyExpr.and(applyingChatEditsFailedContextKey.negate(), ContextKeyExpr.and(hasAppliedChatEditsContextKey, hasUndecidedChatEditingResourceContextKey))
				}
			],
		});
	}

	override async runEditingSessionAction(accessor: ServicesAccessor, editingSession: IChatEditingSession, chatWidget: IChatWidget, ...args: any[]): Promise<void> {
		await editingSession.show();
	}
}
registerAction2(ChatEditingShowChangesAction);

registerAction2(class AddFilesToWorkingSetAction extends EditingSessionAction {
	constructor() {
		super({
			id: 'workbench.action.chat.addSelectedFilesToWorkingSet',
			title: localize2('workbench.action.chat.addSelectedFilesToWorkingSet.label', "Add Selected Files to Working Set"),
			icon: Codicon.attach,
			precondition: ChatContextKeys.location.isEqualTo(ChatAgentLocation.EditingSession),
			f1: true
		});
	}

	override async runEditingSessionAction(accessor: ServicesAccessor, editingSession: IChatEditingSession, chatWidget: IChatWidget, ...args: any[]): Promise<void> {
		const listService = accessor.get(IListService);
		const editorGroupService = accessor.get(IEditorGroupsService);

		const uris: URI[] = [];

		for (const group of editorGroupService.getGroups(GroupsOrder.MOST_RECENTLY_ACTIVE)) {
			for (const selection of group.selectedEditors) {
				if (selection.resource) {
					uris.push(selection.resource);
				}
			}
		}

		if (uris.length === 0) {
			const selection = listService.lastFocusedList?.getSelection();
			if (selection?.length) {
				for (const file of selection) {
					if (!!file && typeof file === 'object' && 'resource' in file && URI.isUri(file.resource)) {
						uris.push(file.resource);
					}
				}
			}
		}

		for (const file of uris) {
			chatWidget.attachmentModel.addFile(file);
		}
	}
});

registerAction2(class OpenWorkingSetHistoryAction extends Action2 {

	static readonly id = 'chat.openFileUpdatedBySnapshot';
	constructor() {
		super({
			id: OpenWorkingSetHistoryAction.id,
			title: localize('chat.openFileUpdatedBySnapshot.label', "Open File"),
			menu: [{
				id: MenuId.ChatEditingCodeBlockContext,
				group: 'navigation',
				order: 0,
			},]
		});
	}

	override async run(accessor: ServicesAccessor, ...args: any[]): Promise<void> {
		const context: { sessionId: string; requestId: string; uri: URI; stopId: string | undefined } | undefined = args[0];
		if (!context?.sessionId) {
			return;
		}

		const editorService = accessor.get(IEditorService);
		await editorService.openEditor({ resource: context.uri });
	}
});

registerAction2(class OpenWorkingSetHistoryAction extends Action2 {

	static readonly id = 'chat.openFileSnapshot';
	constructor() {
		super({
			id: OpenWorkingSetHistoryAction.id,
			title: localize('chat.openSnapshot.label', "Open File Snapshot"),
			menu: [{
				id: MenuId.ChatEditingCodeBlockContext,
				group: 'navigation',
				order: 1,
			},]
		});
	}

	override async run(accessor: ServicesAccessor, ...args: any[]): Promise<void> {
		const context: { sessionId: string; requestId: string; uri: URI; stopId: string | undefined } | undefined = args[0];
		if (!context?.sessionId) {
			return;
		}

		const chatService = accessor.get(IChatService);
		const chatEditingService = accessor.get(IChatEditingService);
		const editorService = accessor.get(IEditorService);

		const chatModel = chatService.getSession(context.sessionId);
		if (!chatModel) {
			return;
		}

		const snapshot = chatEditingService.getEditingSession(chatModel.sessionId)?.getSnapshotUri(context.requestId, context.uri, context.stopId);
		if (snapshot) {
			const editor = await editorService.openEditor({ resource: snapshot, label: localize('chatEditing.snapshot', '{0} (Snapshot)', basename(context.uri)), options: { transient: true, activation: EditorActivation.ACTIVATE } });
			if (isCodeEditor(editor)) {
				editor.updateOptions({ readOnly: true });
			}
		}
	}
});
