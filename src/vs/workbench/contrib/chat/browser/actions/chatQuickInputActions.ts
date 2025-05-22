/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


export const ASK_QUICK_QUESTION_ACTION_ID = 'workbench.action.quickchat.toggle';
export function registerQuickChatActions() {


	// registerAction2(class OpenInChatViewAction extends Action2 {
	// 	constructor() {
	// 		super({
	// 			id: 'workbench.action.quickchat.openInChatView',
	// 			title: localize2('chat.openInChatView.label', "Open in Chat View"),
	// 			f1: false,
	// 			category: CHAT_CATEGORY,
	// 			icon: Codicon.commentDiscussion,
	// 			menu: {
	// 				id: MenuId.ChatInputSide,
	// 				group: 'navigation',
	// 				order: 10
	// 			}
	// 		});
	// 	}

	// 	run(accessor: ServicesAccessor) {
	// 		const quickChatService = accessor.get(IQuickChatService);
	// 		quickChatService.openInChatView();
	// 	}
	// });

	// registerAction2(class CloseQuickChatAction extends Action2 {
	// 	constructor() {
	// 		super({
	// 			id: 'workbench.action.quickchat.close',
	// 			title: localize2('chat.closeQuickChat.label', "Close Quick Chat"),
	// 			f1: false,
	// 			category: CHAT_CATEGORY,
	// 			icon: Codicon.close,
	// 			menu: {
	// 				id: MenuId.ChatInputSide,
	// 				group: 'navigation',
	// 				order: 20
	// 			}
	// 		});
	// 	}

	// run(accessor: ServicesAccessor) {
	// 	const quickChatService = accessor.get(IQuickChatService);
	// 	quickChatService.close();
	// }

}

