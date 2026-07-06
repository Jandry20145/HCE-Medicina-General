export const selectStyles = {
  control: (base) => ({ 
    ...base, 
    background: '#ffffff',
    borderColor: '#e2e8f0', 
    color: '#1e293b',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#3b82f6'
    }
  }),
  menu: (base) => ({ 
    ...base, 
    background: '#ffffff',
    border: '1px solid #e2e8f0'
  }),
  option: (base, state) => ({ 
    ...base, 
    backgroundColor: state.isFocused ? '#eff6ff' : 'transparent',
    color: state.isFocused ? '#2563eb' : '#475569',
    cursor: 'pointer'
  }),
  singleValue: (base) => ({ 
    ...base, 
    color: '#1e293b' 
  }),
  input: (base) => ({ 
    ...base, 
    color: '#1e293b' 
  })
};
