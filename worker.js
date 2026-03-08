export default {
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket required", { status: 400 });
    }

    const target = "wss://srv-v0.netmaster.cam:3306";

    const wsPair = new WebSocketPair();
    const [client, worker] = Object.values(wsPair);

    worker.accept();

    const server = new WebSocket(target);

    server.onopen = () => {
      worker.addEventListener("message", msg => {
        server.send(msg.data);
      });

      server.addEventListener("message", msg => {
        worker.send(msg.data);
      });
    };

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};
