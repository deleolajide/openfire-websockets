package com.ifsoft.websockets.servlet;

import org.jivesoftware.util.JiveGlobals;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.security.*;
import java.util.*;
import java.text.*;
import java.net.*;
import java.security.cert.Certificate;
import java.util.concurrent.ConcurrentHashMap;
import java.math.BigInteger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.websocket.WebSocket;
import org.eclipse.jetty.websocket.WebSocketFactory;
import org.eclipse.jetty.websocket.WebSocketServlet;

import org.jivesoftware.util.ParamUtils;
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

import com.ifsoft.websockets.plugin.WebSocketsPlugin;
import com.ifsoft.websockets.*;

import org.xmpp.packet.*;

import org.dom4j.*;

public final class XMPPServlet extends WebSocketServlet
{
    private static Logger Log = LoggerFactory.getLogger( "XMPPServlet" );

    private ConcurrentHashMap<String, XMPPServlet.XMPPWebSocket> sockets;
    private String remoteAddr;

    public XMPPServlet() {
    	sockets = ( ( WebSocketsPlugin) XMPPServer.getInstance().getPluginManager().getPlugin( "websockets" ) ).getSockets();
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException
    {
    	// get remote addr

    	try {
    		getServletContext().getNamedDispatcher( "default" ).forward( request, response );
    	} catch ( Exception e ) {
    		Log.error( "An error has occurred : ",  e );
    		response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Websocket only.");
    	}
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException
    {
    	doGet( request, response );
    }

    public boolean checkOrigin(HttpServletRequest request, String origin)
    {
    	String username = URLDecoder.decode( ParamUtils.getParameter(request, "username") );
		String password = ParamUtils.getParameter(request, "password");
		String resource = ParamUtils.getParameter(request, "resource");

		// escape node from username
		username = JID.escapeNode( username );

		// make sure to pass the resource as part of the digest
		String digest = getMD5( username + password + resource );
		Log.debug( "checkOrigin: Digest created for " + username + " : " + password + " : " + resource + " = " + digest );

		if ( xmppConnect( username, password, resource, request ) == null ) {
			return false;
		} else {
			return true;
		}
    }

	@Override
	public WebSocket doWebSocketConnect(HttpServletRequest request, String protocol) {

		/*
		long stamp = System.currentTimeMillis();
		for ( Enumeration p = request.getParameterNames() ; p.hasMoreElements() ; ) {
			String element = (String) p.nextElement();
			Log.info( stamp + " : Parameter found : " + element + " = " + request.getParameter( element ) );
		}
		*/

		String username = URLDecoder.decode( ParamUtils.getParameter(request, "username") );
		String password = ParamUtils.getParameter(request, "password");
		String resource = ParamUtils.getParameter(request, "resource");

		// escape node from username
		username = JID.escapeNode( username );

		XMPPWebSocket socket = xmppConnect( username, password, resource, request );
		Log.debug( socket.getDigest() + " : doWebSocketConnect : Digest created for " + username + " : " + password + " : " + resource );

		try {
			// return the socket that has been stored in cache
			return socket;
		} catch ( Exception e ) {
			Log.error( "An error occurred while attempting to get a sesison from cache : ", e );
			return null;
		}
	}

	 public static String getMD5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(input.getBytes());
            BigInteger number = new BigInteger(1, messageDigest);
            String hashtext = number.toString(16);
            // Now we need to zero pad it if you actually want the full 32 chars.
            while (hashtext.length() < 32) {
                hashtext = "0" + hashtext;
            }
            return hashtext;
        }
        catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

	public class XMPPWebSocket implements WebSocket.OnTextMessage {

		private Connection conn;
		private WSConnection wsConnection;
		private String digest;
		private LocalClientSession session;

		public XMPPWebSocket( String digest, WSConnection wsConnection ) {
			this.digest = digest;
			this.wsConnection = wsConnection;
		}

		public String getDigest() {
			return digest;
		}

		public void setSession( LocalClientSession session ) {
			this.session = session;
		}

		public LocalClientSession getSession() {
			return session;
		}

		public boolean isOpen() {
			return conn.isOpen();
		}

		@Override
		public void onOpen(Connection connection) {

			wsConnection.setSocket( this );
			conn = connection;
			Log.debug( digest + " : onOpen : Socket opened" );
			sockets.put( digest, this );
			// send back a message stating that a websocket connection has been made
			/*
			try {
				conn.sendMessage( "XMPP Server recieved Web Socket upgrade and added to Receiver List." );
			} catch ( IOException e ) {
				Log.error( "An error occurred : ", e );
			}
			*/
		}

		@Override
		public void onClose( int closeCode, String message ) {
			try {
				sockets.remove( digest );
				session.close();
				session = null;
			} catch ( Exception e ) {
				Log.error( "An error occurred while attempting to remove the socket and session", e );
			}
			Log.debug( digest + " : onClose : WebSocket closed" );
			Log.debug( digest + " : onClose : has socket in cache = " + sockets.containsKey( digest ) );
		}

		@Override
		public void onMessage(String data) {
			if ( !"".equals( data.trim() ) ) {
				try {
					Log.debug( digest + " : onMessage : Received : " + data );
					wsConnection.getRouter().route( DocumentHelper.parseText( data ).getRootElement() );
				} catch ( Exception e ) {
					Log.error( "An error occurred while attempting to route the packet : ", e );
				}
			}
		}

		public void deliver(String packet)
        {
            if (conn.isOpen() && !"".equals( packet.trim() ) )
            {
                try {
                	Log.debug( digest + " : Delivered : " + packet );
                	conn.sendMessage(packet);
                } catch (Exception e) {
                    Log.error("XMPPWebSocket deliver " + e);
                }
            }
        }

		public void disconnect()
        {
            Log.debug( digest + " : disconnect : XMPPWebSocket disconnect");
            Log.debug( "Total websockets created : " + sockets.size() );
            try {
            	if (conn.isOpen())
	            {
	                conn.disconnect();
	            }
            } catch ( Exception e ) {
            	Log.error( "An error has occurred", e );
            }
            try {
            	sockets.remove( digest );
            	SessionManager.getInstance().removeSession( session );
            } catch ( Exception e ) {
            	Log.error( "An error has occurred", e );
            }
            session = null;
        }
	}

	// ------------------------------------------------------------------------
    //
    // XMPPConnect
    //
    // ------------------------------------------------------------------------
	private XMPPWebSocket xmppConnect(String username, String password, String resource, HttpServletRequest request)
    {

    	// make sure to pass the resource as part of the digest
 		String digest = getMD5( username + password + resource );
 		Log.debug( digest + " : doWebSocketConnect : Digest created for " + username + " : " + password + " : " + resource );

 		XMPPWebSocket socket;

 		// if the socket has been chaced then use it
 		if ( sockets.containsKey( digest ) ) {
 			Log.debug( "Socket found in cache for digest " + digest );
 			try {
 				// WSConnection connection = (WSConnection) session.getConnection();
 				socket = ( XMPPWebSocket ) sockets.get( digest );
 				try {
 					WSConnection connection = (WSConnection) socket.getSession().getConnection();
 					return socket;
 				} catch ( Exception e ) {
 					// remote sesison is connection state fails
 					SessionManager.getInstance().removeSession( socket.getSession() );
 					return null;
 				}
 			} catch ( Exception e ) {
 				// attempt to remove session
 				Log.error( "An error occurred while attempting to get the socket from cache", e );
 				return null;
 			}
 		}

 		// get remote addr
 		String remoteAddr = request.getRemoteAddr();
 		if ( JiveGlobals.getProperty("websockets.header.remoteaddr") != null && request.getHeader( JiveGlobals.getProperty("websockets.header.remoteaddr") ) != null) {
 			remoteAddr = request.getHeader( JiveGlobals.getProperty("websockets.header.remoteaddr") );
 		}

 		try {
 			// THE FOLLOWING 2 CLASSES CAN REFERENCE EACHOTHER
 			// create the connection that hooks into XMPP
 			WSConnection wsConnection = new WSConnection( remoteAddr, request.getRemoteHost() );
 			// create websocket
 			socket = new XMPPWebSocket( digest, wsConnection );
 			// assign the websocket to the connection
 			wsConnection.setSocket( socket );

 			// create a new session and assign the connection to it
 			LocalClientSession session = SessionManager.getInstance().createClientSession( wsConnection, new BasicStreamID("url" + System.currentTimeMillis() ) );
 			// assign a router for the connection to use which has a reference to the session
 			wsConnection.setRouter( new SessionPacketRouter( session ) );

			AuthToken authToken;

			if (username.equals("null") && password.equals("null"))
			{
				authToken = new AuthToken(resource, true);

			} else {

				try {
					authToken = AuthFactory.authenticate( username, password );
				} catch ( UnauthorizedException e ) {
					Log.error( "An error occurred while attempting to create a web socket (USERNAME: " + username + " PASSWORD: " + password + " RESOURCE: " + resource + " ) : ", e );
					return null;
				} catch ( Exception e ) {
					Log.error( "An error occurred while attempting to create a web socket : ", e );
					return null;
				}
			}

			session.setAuthToken(authToken, resource);
 			socket.setSession( session );

 			Log.debug( "Created new socket for digest " + digest );
 			Log.debug( "Total websockets created : " + sockets.size() );
 		} catch ( Exception e ) {
 			Log.error( "An error occurred while attempting to create a new socket" );
 			return null;
 		}

 		// return a websocket
 		return socket;
    }

}
