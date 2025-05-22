/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from '../../../../nls.js';
import { Color } from '../../../../base/common/color.js';
import { registerColor, transparent } from '../colorUtils.js';

export const foreground = registerColor('foreground',
	{ dark: '#E0E0E0', light: '#333333', hcDark: '#FFFFFF', hcLight: '#292929' },
	nls.localize('foreground', "Overall foreground color. This color is only used if not overridden by a component."));

export const disabledForeground = registerColor('disabledForeground',
	{ dark: '#E0E0E080', light: '#33333380', hcDark: '#A5A5A5', hcLight: '#7F7F7F' },
	nls.localize('disabledForeground', "Overall foreground for disabled elements. This color is only used if not overridden by a component."));

export const errorForeground = registerColor('errorForeground',
	{ dark: '#FF6B6B', light: '#CC0000', hcDark: '#FF6B6B', hcLight: '#B5200D' },
	nls.localize('errorForeground', "Overall foreground color for error messages. This color is only used if not overridden by a component."));

export const descriptionForeground = registerColor('descriptionForeground',
	{ light: '#666666', dark: transparent(foreground, 0.7), hcDark: transparent(foreground, 0.7), hcLight: transparent(foreground, 0.7) },
	nls.localize('descriptionForeground', "Foreground color for description text providing additional information, for example for a label."));

export const iconForeground = registerColor('icon.foreground',
	{ dark: '#C5C5C5', light: '#444444', hcDark: '#FFFFFF', hcLight: '#292929' },
	nls.localize('iconForeground', "The default color for icons in the workbench."));

export const focusBorder = registerColor('focusBorder',
	{ dark: '#FF5800', light: '#FF5800', hcDark: '#FF5800', hcLight: '#FF5800' },
	nls.localize('focusBorder', "Overall border color for focused elements. This color is only used if not overridden by a component."));

export const contrastBorder = registerColor('contrastBorder',
	{ light: null, dark: null, hcDark: '#FF5800', hcLight: '#FF5800' },
	nls.localize('contrastBorder', "An extra border around elements to separate them from others for greater contrast."));

export const activeContrastBorder = registerColor('contrastActiveBorder',
	{ light: null, dark: null, hcDark: focusBorder, hcLight: focusBorder },
	nls.localize('activeContrastBorder', "An extra border around active elements to separate them from others for greater contrast."));

export const selectionBackground = registerColor('selection.background',
	null,
	nls.localize('selectionBackground', "The background color of text selections in the workbench (e.g. for input fields or text areas). Note that this does not apply to selections within the editor."));

// ------ text link
export const textLinkForeground = registerColor('textLink.foreground',
	{ light: '#FF5800', dark: '#FF5800', hcDark: '#FF5800', hcLight: '#FF5800' },
	nls.localize('textLinkForeground', "Foreground color for links in text."));

export const textLinkActiveForeground = registerColor('textLink.activeForeground',
	{ light: '#FF8533', dark: '#FF8533', hcDark: '#FF8533', hcLight: '#FF8533' },
	nls.localize('textLinkActiveForeground', "Foreground color for links in text when clicked on and on mouse hover."));

export const textSeparatorForeground = registerColor('textSeparator.foreground',
	{ light: '#0000002e', dark: '#ffffff2e', hcDark: Color.black, hcLight: '#292929' },
	nls.localize('textSeparatorForeground', "Color for text separators."));

// ------ text preformat
export const textPreformatForeground = registerColor('textPreformat.foreground',
	{ light: '#A31515', dark: '#D7BA7D', hcDark: '#000000', hcLight: '#FFFFFF' },
	nls.localize('textPreformatForeground', "Foreground color for preformatted text segments."));

export const textPreformatBackground = registerColor('textPreformat.background',
	{ light: '#0000001A', dark: '#FFFFFF1A', hcDark: '#FFFFFF', hcLight: '#09345f' },
	nls.localize('textPreformatBackground', "Background color for preformatted text segments."));

// ------ text block quote
export const textBlockQuoteBackground = registerColor('textBlockQuote.background',
	{ light: '#f5f5f5', dark: '#252526', hcDark: null, hcLight: '#F2F2F2' },
	nls.localize('textBlockQuoteBackground', "Background color for block quotes in text."));

export const textBlockQuoteBorder = registerColor('textBlockQuote.border',
	{ light: '#FF580080', dark: '#FF580080', hcDark: Color.white, hcLight: '#292929' },
	nls.localize('textBlockQuoteBorder', "Border color for block quotes in text."));

// ------ text code block
export const textCodeBlockBackground = registerColor('textCodeBlock.background',
	{ light: '#f0f0f066', dark: '#1E1E1E66', hcDark: Color.black, hcLight: '#F2F2F2' },
	nls.localize('textCodeBlockBackground', "Background color for code blocks in text."));
