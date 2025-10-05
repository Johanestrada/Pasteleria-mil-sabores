import React, {useState} from "react";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import PropTypes from "prop-types";
import { validarRun, validarEmail,validarMayoriaEdad} from "../../utils/validaciones";
import { addUser} from "../../services/firestoreService";
import { useHistory} from "react-router-dom"; 

const UserForm =()=>{
    const [ from, setForm ] = useState({
        nombre: "",
        email: "",
        run: "",
        fechaNacimiento: ""
    });
    const[ msg,setMsg] = useState("");
    const history = useHistory();
    const handleChange = e => setForm({
        ...from,
        [e.target.name]: e.target.value
    });

    const handleSubmit = async e => {
        e.preventDefault();
        const { nombre, email, run, fechaNacimiento } = from;
        if(!validarRun(run)){
            setMsg("El RUN ingresado no es válido.");
            return;
        }
        if(!nombre){
            setMsg("El nombre es obligatorio.");
            return;
        }
        if(!validarEmail(email)){
            setMsg("El email ingresado no es válido.");
            return;
        }
        if(!validarMayoriaEdad(fechaNacimiento)){
            setMsg("Debes ser mayor de edad para registrarte.");
            return;
        }
        await addUser(form);
        setMsg("formulario enviado correctamente");
        setTimeout(() => {
            history.push(email==="admin@duoc.cl" ? "/perfil-admin?nombre="+nombre : "/perfil-cliente?nombre="+nombre);
        }, 1000);
    };
    return(
        <form onSubmit={handleSubmit}>
            <Input id=""label="Nombre" name="nombre" type="text" placeholder="Ingrese su nombre" value={from.nombre} onChange={handleChange} required />
            <Input id=""label="Email" name="email" type="email" placeholder="Ingrese su email" value={from.email} onChange={handleChange} required />
            <Input id=""label="RUN" name="run" type="text" placeholder="Ingrese su RUN" value={from.run} onChange={handleChange} required />
            <Input id=""label="Fecha de Nacimiento" name="fechaNacimiento" type="date" placeholder="Ingrese su fecha de nacimiento" value={from.fechaNacimiento} onChange={handleChange} required />
            <Button type="submit">Enviar</Button>
            {msg && <p>{msg}</p>}
        </form>
    );
}
    

    
