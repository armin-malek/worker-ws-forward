import { connect } from "cloudflare:sockets";

export default {
  async fetch(request) {

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket tunnel endpoint", { status: 200 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const ws = pair[1];
    ws.accept();

    let socket;
    let writer;
    let reader;

    ws.addEventListener("message", async (event) => {
      const data = new Uint8Array(event.data);

      // First packet contains target info
      if (!socket) {
        const text = new TextDecoder().decode(data);
        const [host, port] = text.split(":");

        socket = connect({
          hostname: host,
          port: parseInt(port)
        });

        writer = socket.writable.getWriter();
        reader = socket.readable.getReader();

        pipe();
        return;
      }

      await writer.write(data);
    });

    async function pipe() {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        ws.send(value);
      }
    }

    return new Response(null, { status: 101, webSocket: client });
  }
};
