import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { validarRegistro } from '../utils/validaciones';

export default function RegistroForm({ userId = null, collectionName = 'usuarios' }) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    region: '',
    comuna: '',
    fechaNacimiento: '',
    codigo: ''
  });
  const [loading, setLoading] = useState(false);
  const [mensajes, setMensajes] = useState({ errores: [], promociones: [] });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const ref = doc(db, collectionName, userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setForm(prev => ({
            ...prev,
            ...data,
            password: '',
            confirmPassword: ''
          }));
        }
      } catch (err) {
        console.error('Error cargando documento:', err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setMensajes({ errores: [], promociones: [] });

    const { errores, promociones } = validarRegistro(form);
    if (errores && errores.length) {
      setMensajes({ errores, promociones });
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...saveData } = form;
      // No guardar campos vacíos innecesarios
      Object.keys(saveData).forEach(k => {
        if (saveData[k] === '') delete saveData[k];
      });

      if (userId) {
        const ref = doc(db, collectionName, userId);
        await updateDoc(ref, saveData);
        setMensajes({ errores: [], promociones: ['Datos actualizados correctamente.'] });
      } else {
        await addDoc(collection(db, collectionName), saveData);
        setMensajes({ errores: [], promociones: ['Usuario creado correctamente.'] });
        setForm({ nombre: '', email: '', password: '', confirmPassword: '', telefono: '', region: '', comuna: '', fechaNacimiento: '', codigo: '' });
      }
    } catch (err) {
      console.error(err);
      setMensajes({ errores: ['Error al guardar en la base de datos.'], promociones: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGuardar} className="p-3">
      <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="form-control mb-2" />
      <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Email" className="form-control mb-2" />
      <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="form-control mb-2" />
      <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Contraseña" className="form-control mb-2" />
      <input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} type="password" placeholder="Confirmar contraseña" className="form-control mb-2" />
      <input name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} type="date" className="form-control mb-2" />
      <input name="region" value={form.region} onChange={handleChange} placeholder="Región" className="form-control mb-2" />
      <input name="comuna" value={form.comuna} onChange={handleChange} placeholder="Comuna" className="form-control mb-2" />
      <input name="codigo" value={form.codigo} onChange={handleChange} placeholder="Código promo" className="form-control mb-3" />

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>

      {mensajes.errores.length > 0 && (
        <div className="mt-3 text-danger">
          {mensajes.errores.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {mensajes.promociones.length > 0 && (
        <div className="mt-3 text-success">
          {mensajes.promociones.map((p, i) => <div key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
        </div>
      )}
    </form>
  );
}