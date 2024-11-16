import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';

/**
 * Creates a basic HTTP server for handling POST requests and serving static files.
 */
const server = createServer((req, res) => {
  // Handle POST requests for JSON data
  if (
    req.method === 'POST' && req.url === '/data/messages.json' ||
    req.method === 'POST' && req.url === '/data/posts.json'
  ) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
      const newMessage = JSON.parse(body);
      const filename = fileURLToPath(import.meta.url);
      const dirname = path.dirname(filename);

      // Determine the file path based on the request URL
      let filePath;
      if (req.url === '/data/messages.json') {
        filePath = path.join(dirname, '../data/messages.json');
      } else {
        filePath = path.join(dirname, '../data/posts.json');
      }

      readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end("Erreur serveur");
          return;
        }

        let messagesData = JSON.parse(data);
        let conversation = messagesData.find(conv => conv.id === newMessage.id);

        switch (filePath) {
          case path.join(dirname, '../data/messages.json'):
            if (conversation) {
              // If conversation exist, add messages
              conversation.messages.push({
                senderId: newMessage.senderId,
                content: newMessage.content,
                timestamp: newMessage.timestamp
              });
            } else {
              // Creation of new conversation
              conversation = {
                conversationId: newMessage[newMessage.length - 1]?.id || 0,
                friendId: newMessage.friendId,
                messages: [{
                  senderId: newMessage.senderId,
                  content: newMessage.content,
                  timestamp: newMessage.timestamp
                }]
              };
            }
            break;
        
          case path.join(dirname, '../data/posts.json') :
            if (conversation) {
              let lastCommentId = conversation.comments[conversation.comments.length - 1]?.id || 0;
              lastCommentId++;

              /**
               * Recursively adds a reply to a specific comment.
               * @param {Array} comments - The list of comments to search.
               * @param {number} parentId - The ID of the parent comment.
               * @param {Object} replyData - The reply to be added.
               * @param {number} depth - The current depth of the reply (default: 1).
               * @returns {boolean} - Returns true if the reply is added, otherwise false.
               */
              const addReply = (comments, parentId, replyData, depth = 1) => {
                for (const comment of comments) {
                  if (comment.id === parentId) {
                    if (depth < 3) {
                      comment.replies = comment.replies || [];
                      comment.replies.push(replyData);
                    }
                    return true;
                  }
                  if (comment.replies) {
                    const added = addReply(comment.replies, parentId, replyData, depth + 1);
                    if (added) return true;
                  }
                }
                return false;
              };

              const replyData = {
                id: lastCommentId,
                authorId: newMessage.authorId,
                content: newMessage.content,
                timestamp: newMessage.timestamp,
                depth: newMessage.depth,
                ...(newMessage.depth < 3 && { replies: [] })
              };

              if (newMessage.parentId) {
                addReply(conversation.comments, newMessage.parentId, replyData, newMessage.depth);
              } else {
                conversation.comments.push({
                  id: lastCommentId,
                  authorId: newMessage.authorId,
                  content: newMessage.content,
                  timestamp: newMessage.timestamp,
                  depth: newMessage.depth,
                  replies: []
                });
              }
            }
            break;
        }

        // Write the updated data back to the JSON file
        writeFile(filePath, JSON.stringify(messagesData, null, 2), (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end("Erreur lors de l'enregistrement du message");
            return;
          }

          // Respond with the updated conversation
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(conversation));
        });
      });
    });
  } else {
    // Serve static files for non-POST requests
    let reqPath = new URL(req.url, `http://${req.headers.host}`).pathname;

    // Redirect to index.html if the root path is requested
    if (reqPath === '/') {
        reqPath = '/index.html';
    }

    // Define the file path for static files
    const filePath = path.join(basePath, reqPath);
    const extname = path.extname(filePath);
    
    // MIME types for common file extensions
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read and serve the requested file
    readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
  }
});

const PORT = 8888;
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const basePath = path.join(dirname, '../'); 

/**
 * Starts the server and listens for incoming requests.
 */
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});