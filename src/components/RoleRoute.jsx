import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

// RoleRoute: protege una ruta requerida por rol(s)
// props: roles (string or array) - e.g. 'admin' or ['admin','vendedor']
const RoleRoute = ({ roles, component: Component, ...rest }) => {
  const { user } = useContext(UserContext);

  const allowed = (() => {
    if (!roles) return true; // sin restricción
    const needed = Array.isArray(roles) ? roles : [roles];
    if (!user) return false;
    // soportar distintos formatos: user.admin, user.vendedor o user.rol === 'vendedor'
    return needed.some(r => (
      user[r] === true || user.rol === r || (user.claims && user.claims[r] === true)
    ));
  })();

  return (
    <Route
      {...rest}
      render={(props) => (
        allowed ? <Component {...props} /> : <Redirect to="/login" />
      )}
    />
  );
};

export default RoleRoute;
