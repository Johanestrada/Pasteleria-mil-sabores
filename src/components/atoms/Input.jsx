const Input = ({label, ...props}) =>(
    <di>
        <label>{label}</label>
        <input {...props} className="form-control"/>
    </di>
);
export default Input;