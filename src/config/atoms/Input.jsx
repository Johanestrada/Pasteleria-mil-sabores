const Input  = ({label, ... props}) =>(
    <div>
        <label>{label}</label>
        <input {...props} className="form-control"></input> 
        
    </div>
);

export default Input;