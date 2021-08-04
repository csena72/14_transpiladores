import express, { Request, Response, ErrorRequestHandler} from "express";
import {Server,Socket} from "socket.io"
import http  from "http"
import exphbs from "express-handlebars"

const app = express();
const routerApi = express.Router();
const puerto = 8080;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.set("views", "./views");

app.use(express.static(__dirname + "/public"));

interface NuevoMensajeProps {
  mensaje: string;
  hora: string;
  email: string;
}

interface ProductsProsp {
  id: any;
  title: any;
  price: any;
  thumbnail: any;
}

let productos: Array<ProductsProsp> = [];
let producto: ProductsProsp;
let productosWs: Array<ProductsProsp> = []; 
let mensajes: Array<NuevoMensajeProps> = []; 

io.on("connection", (socket:Socket) => {
  socket.emit("mensajes", { mensajes: mensajes });

  socket.on("nuevo-mensaje", (nuevoMensaje: NuevoMensajeProps) => {
    let elNuevoMensaje = {
      mensaje: nuevoMensaje.mensaje,
      hora: nuevoMensaje.hora,
      email: nuevoMensaje.email,
    };
    mensajes.push(elNuevoMensaje);
    io.sockets.emit("recibir nuevoMensaje", [elNuevoMensaje]);
  });

  io.sockets.emit("productosWs", productosWs);

  socket.on("producto-nuevo", (data:any) => {
    productosWs.push(data);
  });
});

app.get("/", (req: Request, res: Response) => {
  res.render("home", { productosWs: productosWs });
});

app.get("/productos/vista", (req: Request, res: Response) => {
  res.render("productos", { productos: productos });
});

routerApi.get("/productos", (req: Request, res: Response) => {
  const response =
    productos.length > 0 ? productos : { error: "no hay productos cargados" };
  res.json(response);
});

routerApi.get("/productos/:id", (req: Request, res: Response) => {
  const paramId = req.params.id;
  const producto = productos.filter(function (producto) {
    return producto.id == paramId;
  });

  const response = producto.length > 0 ? producto : { error: "producto no encontrado" };
  res.send(response);
});

routerApi.post("/productos", (req: Request, res: Response) => {
  producto = req.body;
  producto.id = productos.length + 1;
  productos.push(req.body);

  res.redirect("/");
});

routerApi.put("/productos/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const { title, price, thumbnail } = req.body[0];

  const producto = productos.filter(function (producto) {
    return producto.id === id;
  });

  if (!producto.length) {
    res.send({ error: "No existe el producto" });
  }

  productos.splice(id - 1, 1, { title, price, thumbnail, id });

  res.send({ title, price, thumbnail, id });
});

routerApi.delete("/productos/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const producto = productos.filter(function (producto) {
    return producto.id == id;
  });

  if (!producto.length) {
    res.send({ error: "No existe el producto" });
  }

  productos = productos.filter(function (producto) {    
    return producto.id !== id;
  });

  res.send(producto);
});

app.use("/api", routerApi);

server.listen(puerto, () => {
  console.log(`servidor escuchando en http://localhost:${puerto}`);
});

server.on("error", (error:ErrorRequestHandler) => {
  console.log("error en el servidor:", error);
});
