
import { IoSettings } from "react-icons/io5";
import { useNavigate } from "react-router-dom";


function SettingsCard({
  option,
  index,
  modalHandler = () => {},
  handleToggleChangeFromParent = () => {},
}) {
  const navigate = useNavigate();

  const handleNavigate = (option) => {
    if (option?.active) {
      if (option?.modal && option?.modal === true) {
        modalHandler(true);
     } else if (option.toggle || option.checkboxGroup) {
        return;
      } else {
        navigate(option?.to,{
          state: {
            from: option?.from,
            data: option?.data
          },
        });
      }
    } else {
      return;
    }
  };

  const handleToggleChange = async (newState) => {
    console.log("newState", newState);
    handleToggleChangeFromParent(newState);
  };

  const handleCheckboxChange = (dbField, currentValue) => {
    console.log("Checkbox change:", dbField, "current:", currentValue, "new:", !currentValue);
    

 if (option.title === "Print Format") {
      // If unchecking, don't allow (at least one must be selected)
      if (currentValue === true) {
        return; // Prevent unchecking
      }

      // If checking this one, send updates for all checkboxes
      option.checkboxes.forEach((checkbox) => {
        const shouldBeChecked = checkbox.dbField === dbField;
        
        handleToggleChangeFromParent({
          title: checkbox.dbField,
          value: shouldBeChecked,
        });
      });
    } else {

    // Handle nested fields (like "defaultPrint.print1")
    if (dbField.includes('.')) {
      const [parentField, childField] = dbField.split('.');
      
      // Send the update to parent component
      handleToggleChangeFromParent({
        fieldType: parentField,
        field: childField,
        checked: !currentValue
      });
    } else {
      // For non-nested fields
      handleToggleChangeFromParent({
        fieldType: 'single',
        field: dbField,
        checked: !currentValue
      });
    }
  }
}
console.log("option", option);

  return (
    <div>
      <div
        onClick={() => {
          handleNavigate(option);
        }}
        key={index}
        className={`${
          option?.active === false && "opacity-50 pointer-events-none"
        }  flex items-center justify-between  shadow-md  p-4 rounded-sm hover:bg-slate-100 cursor-pointer`}
      >
        <div className="flex items-center gap-3 ">
          <section className="text-xl ">{option?.icon}</section>
          <section>
            <h3 className="text-xs font-bold">{option.title}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{option.description}</p>
                       
            {option.checkboxGroup && option.checkboxes && (
              <div className="mt-3 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                {option.checkboxes.map((checkbox, checkboxIndex) => (
                  <label
                     key={checkboxIndex}
                    className="flex items-center space-x-2 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checkbox.checked}
                      onChange={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleCheckboxChange(checkbox.dbField, checkbox.checked);
                      }}
                      className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                    />
                    <span className="text-gray-700">
                      {checkbox.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>
        </div>
        {option?.toggle && !option.checkboxGroup ? (
          <ToggleButton
            option={option}
            isChecked={option.toggleValue}
            onToggle={handleToggleChange}
          />
        ) : !option.checkboxGroup ? (
          <button className="px-4 py-2 rounded-lg text-xs font-bold">
            <IoSettings size={15} />
          </button>
        ) : null}
      </div>
    </div>
  )
}


export default SettingsCard;