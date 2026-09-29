import {render,screen,fireEvent} from '@testing-library/react';
import Atmosphere from './Atmosphere';
it('lets the user pause and resume decorative motion without implying runtime activity',()=>{
 render(<Atmosphere compact/>);const scene=screen.getByRole('region',{name:'Workspace atmosphere'});
 fireEvent.click(screen.getByRole('button',{name:'Pause ambient motion'}));expect(scene).toHaveAttribute('data-paused','true');
 fireEvent.click(screen.getByRole('button',{name:'Resume ambient motion'}));expect(scene).toHaveAttribute('data-paused','false');
});
