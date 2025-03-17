/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/chatViewSetup.css';

// import { mainWindow } from '../../../../base/browser/window.js';
// import { toAction} from '../../../../base/common/actions.js';

// import { toErrorMessage } from '../../../../base/common/errorMessage.js';
// import { isCancellationError } from '../../../../base/common/errors.js';

import { Disposable } from '../../../../base/common/lifecycle.js';
// import Severity from '../../../../base/common/severity.js';
// import { StopWatch } from '../../../../base/common/stopwatch.js';
import { equalsIgnoreCase } from '../../../../base/common/strings.js';
// import { isObject } from '../../../../base/common/types.js';
// import { URI } from '../../../../base/common/uri.js';
// import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';

// import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
// import { ICommandService } from '../../../../platform/commands/common/commands.js';
// import {  IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
// import { Extensions as ConfigurationExtensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';

// import { ILogService } from '../../../../platform/log/common/log.js';
// import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import product from '../../../../platform/product/common/product.js';
import { IProductService } from '../../../../platform/product/common/productService.js';
// import { IProgressService, ProgressLocation } from '../../../../platform/progress/common/progress.js';
// import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
// import { Registry } from '../../../../platform/registry/common/platform.js';
// import { ITelemetryService, TelemetryLevel } from '../../../../platform/telemetry/common/telemetry.js';
// import { defaultButtonStyles } from '../../../../platform/theme/browser/defaultStyles.js';
// import { IWorkspaceTrustRequestService } from '../../../../platform/workspace/common/workspaceTrust.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';

import { ExtensionUrlHandlerOverrideRegistry } from '../../../services/extensions/browser/extensionUrlHandler.js';


const defaultChat = {
	extensionId: product.defaultChatAgent?.extensionId ?? '',
	chatExtensionId: product.defaultChatAgent?.chatExtensionId ?? '',
	documentationUrl: product.defaultChatAgent?.documentationUrl ?? '',
	termsStatementUrl: product.defaultChatAgent?.termsStatementUrl ?? '',
	privacyStatementUrl: product.defaultChatAgent?.privacyStatementUrl ?? '',
	skusDocumentationUrl: product.defaultChatAgent?.skusDocumentationUrl ?? '',
	publicCodeMatchesUrl: product.defaultChatAgent?.publicCodeMatchesUrl ?? '',
	upgradePlanUrl: product.defaultChatAgent?.upgradePlanUrl ?? '',
	providerName: product.defaultChatAgent?.providerName ?? '',
	enterpriseProviderId: product.defaultChatAgent?.enterpriseProviderId ?? '',
	enterpriseProviderName: product.defaultChatAgent?.enterpriseProviderName ?? '',
	providerUriSetting: product.defaultChatAgent?.providerUriSetting ?? '',
	providerScopes: product.defaultChatAgent?.providerScopes ?? [[]],
	manageSettingsUrl: product.defaultChatAgent?.manageSettingsUrl ?? '',
	completionsAdvancedSetting: product.defaultChatAgent?.completionsAdvancedSetting ?? '',
	walkthroughCommand: product.defaultChatAgent?.walkthroughCommand ?? '',
	completionsRefreshTokenCommand: product.defaultChatAgent?.completionsRefreshTokenCommand ?? '',
	chatRefreshTokenCommand: product.defaultChatAgent?.chatRefreshTokenCommand ?? '',
};

//#region Contribution

export class ChatSetupContribution extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.chat.setup';

	constructor(
		@IProductService private readonly productService: IProductService
	) {
		super();


		this.registerUrlLinkHandler();
	}


	private registerUrlLinkHandler(): void {
		this._register(ExtensionUrlHandlerOverrideRegistry.registerHandler({
			canHandleURL: url => {
				return url.scheme === this.productService.urlProtocol && equalsIgnoreCase(url.authority, defaultChat.chatExtensionId);
			},
			handleURL: async url => {

				return true;
			}
		}));
	}
}

//#endregion

//#region Setup Rendering


