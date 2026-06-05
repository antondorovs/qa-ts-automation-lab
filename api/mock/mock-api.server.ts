import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { CommentPayload, PostPayload, UserPayload } from '../clients/jsonplaceholder.client';
import {
  createComments,
  createPosts,
  createUsers,
  MOCK_AUTH_TOKEN,
  VALID_LOGIN,
  type CommentRecord,
  type PostRecord,
  type UserRecord,
} from './mock-api.data';

type JsonObject = Record<string, unknown>;

export class MockApiServer {
  private server: Server | undefined;
  private users: UserRecord[] = [];
  private posts: PostRecord[] = [];
  private comments: CommentRecord[] = [];

  baseUrl = '';

  async start(): Promise<void> {
    if (this.server) {
      return;
    }

    this.users = createUsers();
    this.posts = createPosts();
    this.comments = createComments();
    this.server = createServer((request, response) => {
      void this.handleRequest(request, response);
    });

    this.server.listen(0, '127.0.0.1');
    await once(this.server, 'listening');

    const address = this.server.address() as AddressInfo;
    this.baseUrl = `http://127.0.0.1:${address.port}`;
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    this.server.close();
    await once(this.server, 'close');
    this.server = undefined;
    this.baseUrl = '';
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
      const url = new URL(request.url || '/', this.baseUrl || 'http://127.0.0.1');
      const method = request.method || 'GET';

      if (method === 'GET' && url.pathname === '/users') {
        return sendJson(response, 200, this.users);
      }

      const userMatch = url.pathname.match(/^\/users\/(\d+)$/);
      if (method === 'GET' && userMatch) {
        const user = this.users.find((item) => item.id === Number(userMatch[1]));
        return user ? sendJson(response, 200, user) : sendJson(response, 404, { error: 'User not found' });
      }

      if (method === 'POST' && url.pathname === '/users') {
        const body = await readJson(request);
        if (!hasStringFields(body, ['name', 'username', 'email'])) {
          return sendJson(response, 400, { error: 'name, username and email are required' });
        }

        const user: UserRecord = {
          ...(body as UserPayload),
          id: this.users.length + 1,
        };
        this.users.push(user);
        return sendJson(response, 201, user);
      }

      if (method === 'GET' && url.pathname === '/posts') {
        const userId = parseOptionalNumber(url.searchParams.get('userId'));
        const posts = userId === undefined ? this.posts : this.posts.filter((post) => post.userId === userId);
        return sendJson(response, 200, posts);
      }

      if (method === 'POST' && url.pathname === '/posts') {
        const body = await readJson(request);
        if (!hasStringFields(body, ['title', 'body']) || typeof body.userId !== 'number') {
          return sendJson(response, 400, { error: 'title, body and numeric userId are required' });
        }

        const post: PostRecord = {
          ...(body as PostPayload),
          id: this.posts.length + 1,
        };
        this.posts.push(post);
        return sendJson(response, 201, post);
      }

      if (method === 'GET' && url.pathname === '/comments') {
        const postId = parseOptionalNumber(url.searchParams.get('postId'));
        const comments = postId === undefined
          ? this.comments
          : this.comments.filter((comment) => comment.postId === postId);
        return sendJson(response, 200, comments);
      }

      if (method === 'POST' && url.pathname === '/comments') {
        const body = await readJson(request);
        if (
          typeof body.postId !== 'number'
          || !hasStringFields(body, ['name', 'email', 'body'])
        ) {
          return sendJson(response, 400, { error: 'postId, name, email and body are required' });
        }

        const comment: CommentRecord = {
          ...(body as CommentPayload),
          id: this.comments.length + 1,
        };
        this.comments.push(comment);
        return sendJson(response, 201, comment);
      }

      if (method === 'POST' && url.pathname === '/api/login') {
        const body = await readJson(request);
        if (typeof body.email !== 'string' || typeof body.password !== 'string') {
          return sendJson(response, 400, { error: 'email and password are required' });
        }

        if (body.email !== VALID_LOGIN.email || body.password !== VALID_LOGIN.password) {
          return sendJson(response, 401, { error: 'Invalid credentials' });
        }

        return sendJson(response, 200, { token: MOCK_AUTH_TOKEN });
      }

      return sendJson(response, 404, { error: 'Resource not found' });
    } catch (error) {
      return sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'Unexpected mock server error',
      });
    }
  }
}

async function readJson(request: IncomingMessage): Promise<JsonObject> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON request body must be an object');
  }

  return parsed as JsonObject;
}

function hasStringFields(body: JsonObject, fields: string[]): boolean {
  return fields.every((field) => typeof body[field] === 'string' && String(body[field]).trim().length > 0);
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}
