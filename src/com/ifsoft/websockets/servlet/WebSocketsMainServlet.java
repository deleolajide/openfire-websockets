package com.ifsoft.websockets.servlet;


import javax.servlet.http.HttpServlet;
import org.jivesoftware.util.*;


public class WebSocketsMainServlet extends HttpServlet
{
	public void init()
	{
		Log.info("Init WebSocketsMainServlet");

	}


	public void destroy()
	{
		Log.info("Exit WebSocketsMainServlet");

	}

}
