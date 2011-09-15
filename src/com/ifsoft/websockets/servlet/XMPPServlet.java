package com.ifsoft.websockets.servlet;

import org.jivesoftware.util.JiveGlobals;
import org.jivesoftware.util.Log;

import java.io.IOException;
import java.util.*;
import java.text.*;
import java.net.*;
import java.security.cert.Certificate;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketFactory;

import org.jivesoftware.openfire.Connection;
import org.jivesoftware.openfire.SessionManager;
import org.jivesoftware.openfire.StreamID;
import org.jivesoftware.openfire.session.LocalClientSession;
import org.jivesoftware.openfire.net.VirtualConnection;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.auth.AuthToken;
import org.jivesoftware.openfire.auth.AuthFactory;
import org.jivesoftware.openfire.SessionPacketRouter;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.database.SequenceManager;
import org.jivesoftware.openfire.component.InternalComponentManager;

import org.xmpp.packet.*;

import org.dom4j.*;



public final class XMPPServlet extends HttpServlet
{
    private WebSocketFactory _wsFactory;
    private Map<String, LocalClientSession> sessions = new ConcurrentHashMap<String, LocalClientSession>();

    // ------------------------------------------------------------------------
    //
    // Init & Destroy
    //
    // ------------------------------------------------------------------------

    @Override public void init() throws ServletException
    {
		Log.info("Init XMPPServlet");

        _wsFactory=new WebSocketFactory(new WebSocketFactory.Acceptor()
        {
            public boolean checkOrigin(HttpServletRequest request, String origin)
            {
				String username = request.getParameter("username");
				String password = request.getParameter("password");
				String resource = request.getParameter("resource");

				Log.info("XMPPServlet checkOrigin " + origin + " " + username);

				resource = resource == null ? "websockets" : resource;

				if (xmppConnect(username, password, resource) == null)
					return false;
				else
					return true;
            }

            public WebSocket doWebSocketConnect(HttpServletRequest request, String protocol)
            {
				Log.info("doWebSocketConnect " + protocol);

				String username = request.getParameter("username");
				String password = request.getParameter("password");
				String resource = request.getParameter("resource");

				return new XMPPWebSocket(username, password, resource, request.getRemoteAddr(), request.getRemoteHost());
            }
        });


        _wsFactory.setBufferSize(4096);
        _wsFactory.setMaxIdleTime(60000);
    }

	 @Override public void destroy()
	{
		Log.info("Exit XMPPServlet");

	}



    // ------------------------------------------------------------------------
    //
    // doGet
    //
    // ------------------------------------------------------------------------


    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException
    {
        if (_wsFactory.acceptWebSocket(request,response)) return;

        response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Websocket only.");
    }


    private class XMPPWebSocket implements WebSocket.OnTextMessage
    {
        private volatile WebSocket.Connection connection;
        private String username;
        private String password;
        private String resource;
        private String remoteAddr;
        private String remoteHost;
        private String digest;

		public XMPPWebSocket(String username, String password, String resource, String remoteAddr, String remoteHost)
		{
			this.username = username;
			this.password = password;
			this.resource = resource;
			this.resource = resource == null ? "websockets" : resource;

			this.remoteAddr = remoteAddr;
			this.remoteHost = remoteHost;

			this.digest = xmppConnect(username, password, resource);
		}


        public void onOpen(WebSocket.Connection connection)
        {
			Log.info("XMPPWebSocket onOpen");
            this.connection = connection;

			try {
				LocalClientSession session = sessions.get(digest);
				WSConnection xmppConnection = (WSConnection) session.getConnection();
				xmppConnection.setService(this);

			} catch (Exception e) {
				Log.error("XMPPWebSocket onOpen " + e);
			}
        }

        public void onClose(int closeCode, String message)
        {
			Log.info("XMPPWebSocket onClose " + message);

			LocalClientSession session = sessions.remove(digest);
			session.close();
			session = null;
        }

        public void onMessage(String data)
        {
			Log.debug("XMPPWebSocket onMessage \n" + data);

			if (" ".equals(data) == false)
			{
				try {
					LocalClientSession session = sessions.get(digest);
					WSConnection xmppConnection = (WSConnection) session.getConnection();
					xmppConnection.getRouter().route(DocumentHelper.parseText(data).getRootElement());

				} catch (Exception e) {

					Log.error("XMPPWebSocket onMessage " + e);
				}
			}
        }

		public String getHostAddress()
		{
			return remoteAddr;
		}

		public String getHostName()
		{
			return remoteHost;
		}

		public void deliver(String packet)
		{
			Log.info("XMPPWebSocket deliver \n" + packet);

			if (connection.isOpen())
			{
				try {

					connection.sendMessage(packet);

				} catch (Exception e) {

					Log.error("XMPPWebSocket deliver " + e);
				}
			}
		}

		public void disconnect()
		{
			Log.info("XMPPWebSocket disconnect");

			if (connection.isOpen())
			{
				connection.disconnect();
			}
		}
    }




    // ------------------------------------------------------------------------
    //
    // XMPPConnect
    //
    // ------------------------------------------------------------------------


    private String xmppConnect(String username, String password, String resource)
    {
		String digest = AuthFactory.createDigest(username, password);

        Log.info( "xmppConnect " + username + " digest " + digest);

        if (sessions.containsKey(digest))
        {
			LocalClientSession session = sessions.get(digest);

			try {
				WSConnection connection = (WSConnection) session.getConnection();
				return digest;

			} catch (Exception e) {
				Log.error("xmppConnect " + e);
				return null;
			}

		} else {

			WSConnection connection = new WSConnection(digest);
			LocalClientSession session = SessionManager.getInstance().createClientSession(connection, new BasicStreamID("url" + System.currentTimeMillis()));
			connection.setRouter(new SessionPacketRouter(session));

			try {
				AuthToken authToken = AuthFactory.authenticate(username, password);
				session.setAuthToken(authToken, resource);
				sessions.put(digest, session);

				return digest;

			} catch (Exception e) {
				Log.error("xmppConnect " + e);
				return null;
			}
		}
    }


    // ------------------------------------------------------------------------
    //
    // BasicStreamID
    //
    // ------------------------------------------------------------------------


    private class BasicStreamID implements StreamID {
        String id;

        public BasicStreamID(String id) {
            this.id = id;
        }

        public String getID() {
            return id;
        }

        public String toString() {
            return id;
        }

        public int hashCode() {
            return id.hashCode();
        }
    }

    // ------------------------------------------------------------------------
    //
    // WSConnection
    //
    // ------------------------------------------------------------------------



    public class WSConnection extends VirtualConnection
    {
        private SessionPacketRouter router;
        private XMPPWebSocket wsSession;
        private String digest;

        public WSConnection(String digest)
        {
            this.wsSession = wsSession;
			this.digest = digest;
        }

		public SessionPacketRouter getRouter()
		{
			return router;
		}

		public String getDigest()
		{
			return digest;
		}

		public void setService(XMPPWebSocket wsSession)
		{
            this.wsSession = wsSession;
		}

		public void setRouter(SessionPacketRouter router)
		{
			this.router = router;
		}

        public void closeVirtualConnection()
        {
            Log.info("WSConnection - close ");
			wsSession.disconnect();
        }

        public byte[] getAddress() {
            return wsSession.getHostAddress().getBytes();
        }

        public String getHostAddress() {
            return wsSession.getHostAddress();
        }

        public String getHostName()  {
            return wsSession.getHostName();
        }

        public void systemShutdown() {

        }

        public void deliver(Packet packet) throws UnauthorizedException
        {
			deliverRawText(packet.toXML());
        }

        public void deliverRawText(String text)
        {
            Log.info("WSConnection - deliverRawText \n" + text);

			wsSession.deliver(text);
        }

        public Certificate[] getPeerCertificates() {
            return null;
        }
    }

}
