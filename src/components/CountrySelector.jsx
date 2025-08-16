import React, { useState, useMemo } from 'react'
import Select from 'react-select'
import countryList from 'react-select-country-list'
import { ChevronDown } from 'lucide-react'

// Move getCountryFlag function to the top, before it's used
const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode === 'global') return '🌍'
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()))
}

const CountrySelector = ({ selectedCountry, onCountryChange, className = "" }) => {
  const options = useMemo(() => {
    const countries = countryList().getData()
    
    return [
      { 
        value: 'global', 
        label: '🌍 Global News',
        country: 'Global'
      },
      ...countries.map(country => ({
        value: country.value.toLowerCase(), // ISO country code
        label: `${getCountryFlag(country.value)} ${country.label}`,
        country: country.label
      }))
    ]
  }, [])

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      borderColor: state.isFocused ? '#346dca' : '#dde0e4',
      borderRadius: '0.5rem',
      minHeight: '40px',
      boxShadow: state.isFocused ? '0 0 0 1px #346dca' : 'none',
      '&:hover': {
        borderColor: '#346dca'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#346dca' 
        : state.isFocused 
        ? '#e8f0fe' 
        : 'white',
      color: state.isSelected ? 'white' : '#121417',
      padding: '10px 12px',
      cursor: 'pointer',
      fontSize: '14px'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#121417',
      fontSize: '14px',
      fontWeight: '500'
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      border: '1px solid #dde0e4',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 9999
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
      position: 'fixed'
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '250px',
      padding: '4px'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6b7280',
      fontSize: '14px'
    })
  }

  const selectedOption = options.find(option => option.value === selectedCountry)

  const portalTarget = typeof document !== 'undefined' ? document.body : null

  return (
    <div className={`min-w-[180px] ${className}`}>
      <Select
        value={selectedOption}
        onChange={(option) => onCountryChange(option.value)}
        options={options}
        styles={customStyles}
        isSearchable
        placeholder="Select country..."
        components={{
          DropdownIndicator: () => (
            <ChevronDown size={16} className="mr-2 text-gray-500" />
          )
        }}
        menuPortalTarget={portalTarget}
        menuPosition="fixed"
        menuPlacement="auto"
        noOptionsMessage={() => "No countries found"}
      />
    </div>
  )
}

export default CountrySelector
