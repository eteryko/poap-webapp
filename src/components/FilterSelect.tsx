import React from 'react';

type FilterSelectProps = {
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
};

const FilterSelect: React.FC<FilterSelectProps> = ({ children, handleChange, className }) => (
  <select className={'filter-base filter-select ' + (className ? className : '')} onChange={handleChange}>
    {children}
  </select>
);

export default FilterSelect;
