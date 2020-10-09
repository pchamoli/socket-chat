const { io } = require('../server');

const {Usuarios} = require('../classes/usuarios') 
const {crearMensaje} = require('../utilidades/utilidades')

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (usuario, callback) => {

        if (!usuario.nombre){
            if (typeof callback ==="function")
            callback({
                error: true,
                mensaje: 'El nombre es necesario'
            });
            return
        }

        if (!usuario.sala){
            if (typeof callback ==="function")
            callback({
                error: true,
                mensaje: 'La sala es necesaria'
            });
            return
        }

        client.join(usuario.sala)

        usuarios.agregarPersona(client.id, usuario.nombre, usuario.sala)
    
        client.broadcast.to(usuario.sala).emit('listaPersona', usuarios.getPersonasPorSala(usuario.sala))
        client.broadcast.to(usuario.sala).emit('crearMensaje', crearMensaje('Administrador', `${usuario.nombre} se unió`));

        if (typeof callback === "function")
            callback(usuarios.getPersonasPorSala(usuario.sala))

        // console.log(usuarios.getPersonasPorSala(usuario.sala));
    })
    
    client.on('crearMensaje', (data, callback) => {
        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);

        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje)

        callback( mensaje );
    })

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);

        if (personaBorrada){
            client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salió`));
            client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
        }   
    })

    client.on('mensajePrivado', (data) => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });
});