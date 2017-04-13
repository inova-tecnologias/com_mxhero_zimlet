/*
 * ***** BEGIN LICENSE BLOCK *****
 * mxsolutions Inc.
 * Copyright (C) 2017 mxsolutions Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * 
 * ***** END LICENSE BLOCK *****
 */

/**
 * Constructor.
 *
 * @author Bruno Santos
 */
function Com_mxHero_Zimlet() {
}

Com_mxHero_Zimlet.prototype = new ZmZimletBase();
Com_mxHero_Zimlet.prototype.constructor = Com_mxHero_Zimlet;

/**
 * Simplify handler object
 */
var mxHeroZimlet = Com_mxHero_Zimlet;

/**
 * The mxHero Compose Button Name.
 */
mxHeroZimlet.COMPOSE_BUTTON = "MXHERO_COMPOSE_BUTTON";

/**
 * The mxHero e-mail action stack.
 */
mxHeroZimlet.currentComposeViewId = null;
mxHeroZimlet.actionStackByView = {};

/**
 * Initializes zimlet
 */
mxHeroZimlet.prototype.init = function ()
{
	this.saveUserProperties();
}

mxHeroZimlet.prototype.menuItemSelected = function (itemId, val)
{
	switch (itemId)
	{
		case "PREFERENCES":
			this.doubleClicked();
			break;
        }
}

/**
 * Adds the mxHero button to the initialized toolbar.
 */
mxHeroZimlet.prototype.initializeToolbar = function (app, toolbar, controller, viewId)
{
	if (viewId.indexOf("COMPOSE") >= 0)
	{
		this._setViewOnActionStack (viewId);

		var button = null;
		var menu = null;

		if ((button = toolbar.getOp (mxHeroZimlet.COMPOSE_BUTTON))) // button already exists
		{
			var menu = button.getMenu (true);
			this._resetComposeMenu (menu);
		}
		else // new button is being created
		{
			var buttonArgs = {
				text: this.getMessage("mxHeroZimlet_buttonLabel"),
				tooltip: this.getMessage("mxHeroZimlet_buttonTooltip"),
				index: 1, // Always after 'send' button
				image: "mxhero-panelIcon"
			};
		
			button = toolbar.createOp (mxHeroZimlet.COMPOSE_BUTTON, buttonArgs);
			menu = new ZmPopupMenu(button); // create menu
			button.setMenu(menu); //add menu to button
		
			this._setAttachmentTrackMenu (menu);
			this._setSendAsPersonalMenu (menu);
			this._setEnhancedBccMenu (menu);
			this._setReadOnceMenu (menu);
			this._setReplyTimeoutMenu (menu);
			this._setHelpMenu (menu);
		}
	}
}

mxHeroZimlet.prototype._setReadOnceMenu = function (menu)
{
	var item = menu.createMenuItem(Dwt.getNextId(), {text:this.getMessage("mxHeroZimlet_buttonReadOnce"), style:DwtMenuItem.CHECK_STYLE});
	item.setToolTipContent( this.getMessage("mxHeroZimlet_buttonReadOnce_tooltip") );
	item.addSelectionListener (new AjxListener(this, this._addReadOnceAction, [item]));
}

mxHeroZimlet.prototype._setSendAsPersonalMenu = function (menu)
{
	var item = menu.createMenuItem(Dwt.getNextId(), {text:this.getMessage("mxHeroZimlet_buttonSendAsPersonal"), style:DwtMenuItem.CHECK_STYLE});
	item.setToolTipContent( this.getMessage("mxHeroZimlet_buttonSendAsPersonal_tooltip") );
	item.addSelectionListener (new AjxListener(this, this._addSendAsPersonalAction, [item]));
}

mxHeroZimlet.prototype._setEnhancedBccMenu = function (menu)
{
	var item = menu.createMenuItem(Dwt.getNextId(), {text:this.getMessage("mxHeroZimlet_buttonEnhancedBcc"), style:DwtMenuItem.CHECK_STYLE});
	item.setToolTipContent( this.getMessage("mxHeroZimlet_buttonEnhancedBcc_tooltip") );
	item.addSelectionListener (new AjxListener(this, this._addEnhancedBccAction, [item]));
}

mxHeroZimlet.prototype._setAttachmentTrackMenu = function (menu)
{
	var item = menu.createMenuItem(Dwt.getNextId(), {text:this.getMessage("mxHeroZimlet_buttonAttachmentTrack"), style:DwtMenuItem.CHECK_STYLE});
	item.setToolTipContent( this.getMessage("mxHeroZimlet_buttonAttachmentTrack_tooltip") );
	item.addSelectionListener (new AjxListener(this, this._addAttachmentTrackAction, [item]));
}

mxHeroZimlet.prototype._setHelpMenu = function (menu)
{
	menu.createMenuItem(Dwt.getNextId(), {style:DwtMenuItem.SEPARATOR_STYLE});
	var item = menu.createMenuItem(Dwt.getNextId(), {text:this.getMessage("mxHeroZimlet_buttonHelp"), style:DwtMenuItem.PUSH_STYLE});
	item.addSelectionListener (new AjxListener(this, this._addHelpAction, [item]));
}

mxHeroZimlet.prototype._setReplyTimeoutMenu = function (menu)
{
	var timeoutArr = new Array ();

	timeoutArr.push ({tag: "None", timeout: 0});
	timeoutArr.push ({tag: "SEPARATOR"});
	//timeoutArr.push ({tag: "1m", timeout: 60}); // for tests only
	timeoutArr.push ({tag: "1h", timeout: 60 * 60 * 1});
	timeoutArr.push ({tag: "3h", timeout: 60 * 60 * 3});
	timeoutArr.push ({tag: "6h", timeout: 60 * 60 * 6});
	timeoutArr.push ({tag: "1d", timeout: 60 * 60 * 24});
	timeoutArr.push ({tag: "3d", timeout: 60 * 60 * 24 * 3});
	timeoutArr.push ({tag: "7d", timeout: 60 * 60 * 24 * 7});
	//timeoutArr.push ({tag: "SEPARATOR"});
	//timeoutArr.push ({tag: "Custom", timeout: "C"});

	var item = menu.createMenuItem(Dwt.getNextId(), {text:this.getMessage("mxHeroZimlet_buttonReplyTimeout"), style:DwtMenuItem.CASCADE_STYLE});
	item.setToolTipContent( this.getMessage("mxHeroZimlet_buttonReplyTimeout_tooltip") );
	submenu = new ZmPopupMenu(item);
	item.setMenu (submenu);

	for (var loop = 0; loop < timeoutArr.length; loop++)
	{
		if (timeoutArr[loop].tag == "SEPARATOR")
		{
			item = submenu.createMenuItem(Dwt.getNextId(), {style:DwtMenuItem.SEPARATOR_STYLE});
			continue;
		}

		item = submenu.createMenuItem(Dwt.getNextId(), {text:this.getMessage("mxHeroZimlet_replyTimeout" + timeoutArr[loop].tag), style:DwtMenuItem.RADIO_STYLE});
		item.addSelectionListener (new AjxListener(this, this._addReplyTimeoutAction, [item, timeoutArr[loop].tag, timeoutArr[loop].timeout]));
	}
}

mxHeroZimlet.prototype._resetComposeMenu = function (menu)
{
	if (!menu)
		return;

	for (var menuItemId in menu.getMenuItems())
	{
		var menuItem = menu.getMenuItem(menuItemId);

		menuItem.setChecked (false);

		var submenu = menuItem.getMenu (true);
		if (submenu)
			this._resetComposeMenu (submenu);
	}
}

mxHeroZimlet.prototype._addAttachmentTrackAction = function (item)
{
	if (item.getChecked())
		this._setActionOnStack ('X-mxHero-Action-AttachmentTrack', {value: 'true'});
	else
		this._setActionOnStack ('X-mxHero-Action-AttachmentTrack', null);
}

mxHeroZimlet.prototype._addReplyTimeoutAction = function (item, tag, timeout)
{
	if (item.getChecked() && timeout > 0)
	{
		var deadline = function () { return ((new Date().valueOf() * 0.001)|0) + timeout; };

		this._setActionOnStack ('X-mxHero-Action-ReplyTimeout', {unixtime: deadline, locale: this.getMessage("mxHeroZimlet_locale")});
	}
	else
		this._setActionOnStack ('X-mxHero-Action-ReplyTimeout', null);
}

mxHeroZimlet.prototype._addReadOnceAction = function (item)
{
	if (item.getChecked())
		this._setActionOnStack ('X-mxHero-Action-ReadOnce', {value: 'true', locale: this.getMessage("mxHeroZimlet_locale")});
	else
		this._setActionOnStack ('X-mxHero-Action-ReadOnce', null);
}

mxHeroZimlet.prototype._addEnhancedBccAction = function (item)
{
	if (item.getChecked())
		this._setActionOnStack ('X-mxHero-Action-EnhancedBcc', {value: 'true', locale: this.getMessage("mxHeroZimlet_locale")});
	else
		this._setActionOnStack ('X-mxHero-Action-EnhancedBcc', null);
}


mxHeroZimlet.prototype._addSendAsPersonalAction = function (item)
{
	if (item.getChecked())
		this._setActionOnStack ('X-mxHero-Action-SendAsPersonal', {value: 'true'});
	else
		this._setActionOnStack ('X-mxHero-Action-SendAsPersonal', null);
}

mxHeroZimlet.prototype._setActionOnStack = function (id, action)
{
	mxHeroZimlet.actionStackByView[mxHeroZimlet.currentComposeViewId][id] = action;
}

mxHeroZimlet.prototype._setViewOnActionStack = function (viewId)
{
	mxHeroZimlet.actionStackByView[viewId] = {};
}

mxHeroZimlet.prototype._addHelpAction = function (item)
{
	var help_tab = window.open();
	help_tab.location = "http://www.mxhero.com/help/zimlet-extension";
}


mxHeroZimlet.prototype.onShowView = function (view, isNewView)
{
	if (view.indexOf("COMPOSE") >= 0)
	{
		mxHeroZimlet.currentComposeViewId = view;
	}
}

mxHeroZimlet.prototype.onSendMsgSuccess = function (controller, msg)
{
	// will be used
	return;
}

mxHeroZimlet.prototype.addCustomMimeHeaders = function (customMimeHeaders)
{
	for (var item in (mxHeroZimlet.actionStackByView[mxHeroZimlet.currentComposeViewId]))
	{

		var data = mxHeroZimlet.actionStackByView[mxHeroZimlet.currentComposeViewId][item];

		if (data)
		{
			var content = '';

			for (var attr in data)
			{
				content += attr + '=' + (typeof data[attr] === 'function' ? data[attr].call(this) : data[attr]) + ';';
			}

			if(content.length > 0){
				content = content.substring(0, content.length - 1);
			}

			customMimeHeaders.push ({name: item, _content: content});
		}
	}
}