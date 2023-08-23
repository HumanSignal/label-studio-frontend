/* global test, expect, jest */
import { render } from "@testing-library/react";
import { HtxHeader } from "../Header";
import "@testing-library/jest-dom";

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

test("Header basic test", () => {
  const confStore = {
    _value: "header text",
    underline: true,
    size: 1,
  };

  const view = render(<HtxHeader item={confStore} />);

  expect(view.getByText('header text')).toBeInTheDocument();
});
