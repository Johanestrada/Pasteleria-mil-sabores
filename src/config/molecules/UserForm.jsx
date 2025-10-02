import React,{useState} from "react";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import {validarRun , validarCorreo, validarMayoriaEdad} from "../../utils/validaciones";
import { addUser} from "../../services/firestoreService";
import {userHistory} from "react-router-dom";


const UserFrom = () =>{
    const[from, setFrom] = useState({ run:"",nombre:"",correo:"", clave:""});
    const[msg, setMsg] = useState("");
    const history = userHistory();
    const handleChange = e => setFrom({...from, [e.target.id]: e.target.value});
}




