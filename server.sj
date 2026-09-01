export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("DS Garage - OAuth online!");
    }

    if (url.pathname === "/oauth/callback") {
      const code = url.searchParams.get("code");

      if (!code) {
        return new Response(
          "DS Garage: código de autorização não recebido.",
          { status: 400 }
        );
      }

      return new Response(
        "DS Garage: autorização recebida com sucesso!"
      );
    }

    return new Response("DS Garage - rota não encontrada", {
      status: 404
    });
  }
};
