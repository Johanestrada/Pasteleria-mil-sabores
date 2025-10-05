const Button =({ Children, ...props}) =>(
    <button {...props} className="btn btn-primary">{Children}</button>
    
);
export default Button;