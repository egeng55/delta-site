import { render, screen } from "@testing-library/react";
import WorkspaceLinks from "./WorkspaceLinks";
jest.mock("next/navigation",()=>({usePathname:()=>"/hq/history"}));
it("connects the existing surfaces and keeps history addressable",()=>{
  render(<WorkspaceLinks />);
  expect(screen.getByRole("link",{name:"History"})).toHaveAttribute("href","/hq/history");
  expect(screen.getByRole("link",{name:"History"})).toHaveAttribute("aria-current","page");
  expect(screen.getByRole("link",{name:"Workspace"})).toHaveAttribute("href","/workspace");
  expect(screen.getByRole("link",{name:"Delta website"})).toHaveAttribute("href","/");
});
