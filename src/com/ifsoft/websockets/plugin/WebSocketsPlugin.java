package com.ifsoft.websockets.plugin;

import org.jivesoftware.openfire.container.Plugin;
import org.jivesoftware.openfire.container.PluginManager;
import org.jivesoftware.util.*;
import org.jivesoftware.openfire.http.HttpBindManager;

import java.util.*;
import java.io.File;

import org.apache.log4j.Logger;

import org.eclipse.jetty.server.handler.ContextHandlerCollection;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.webapp.WebAppContext;

public class WebSocketsPlugin implements Plugin, WebSocketsConstants {

	private static final String NAME 		= "websockets";
	private static final String DESCRIPTION = "WebSockets Plugin for Openfire";

	private PluginManager manager;
    private File pluginDirectory;



	public void initializePlugin(PluginManager manager, File pluginDirectory)
	{
		Log.info( "["+ NAME + "] initialize " + NAME + " plugin resources");

		try {

			ContextHandlerCollection contexts = HttpBindManager.getInstance().getContexts();

			try {

				WebAppContext context2 = new WebAppContext(contexts, pluginDirectory.getPath(), "/" + JiveGlobals.getProperty("websockets.webapp.name", "ws"));
				context2.setWelcomeFiles(new String[]{"index.html"});
			}
			catch(Exception e) {

        	}
		}
		catch (Exception e) {
			Log.error("Error initializing WebSockets Plugin", e);
		}
	}

	public void destroyPlugin()
	{
		Log.info( "["+ NAME + "] destroy " + NAME + " plugin resources");

		try {


		}
		catch (Exception e) {
			Log.error("["+ NAME + "] destroyPlugin exception " + e);
		}
	}

	public String getName()
	{
		 return NAME;
	}

	public String getDescription()
	{
		return DESCRIPTION;
	}
}