import { fireEvent, render } from "@testing-library/react-native"

import { PaginationBar } from "./PaginationBar"

test("shows the current page out of the total", async () => {
  const view = await render(
    <PaginationBar
      currentPage={1}
      totalPages={3}
      onPrevious={jest.fn()}
      onNext={jest.fn()}
    />,
  )

  expect(view.getByText("2 / 3")).toBeVisible()
})

test("disables the previous button on the first page", async () => {
  const onPrevious = jest.fn()
  const view = await render(
    <PaginationBar
      currentPage={0}
      totalPages={3}
      onPrevious={onPrevious}
      onNext={jest.fn()}
    />,
  )

  const previousButton = view.getByLabelText("Previous page")
  expect(previousButton).toBeDisabled()

  await fireEvent.press(previousButton)
  expect(onPrevious).not.toHaveBeenCalled()
})

test("disables the next button on the last page", async () => {
  const onNext = jest.fn()
  const view = await render(
    <PaginationBar
      currentPage={2}
      totalPages={3}
      onPrevious={jest.fn()}
      onNext={onNext}
    />,
  )

  const nextButton = view.getByLabelText("Next page")
  expect(nextButton).toBeDisabled()

  await fireEvent.press(nextButton)
  expect(onNext).not.toHaveBeenCalled()
})

test("calls onPrevious and onNext when the buttons are enabled", async () => {
  const onPrevious = jest.fn()
  const onNext = jest.fn()
  const view = await render(
    <PaginationBar
      currentPage={1}
      totalPages={3}
      onPrevious={onPrevious}
      onNext={onNext}
    />,
  )

  await fireEvent.press(view.getByLabelText("Previous page"))
  await fireEvent.press(view.getByLabelText("Next page"))

  expect(onPrevious).toHaveBeenCalledTimes(1)
  expect(onNext).toHaveBeenCalledTimes(1)
})

test("renders as an absolutely-positioned overlay so it never affects the grid's layout", async () => {
  const view = await render(
    <PaginationBar
      currentPage={0}
      totalPages={2}
      onPrevious={jest.fn()}
      onNext={jest.fn()}
    />,
  )

  expect(view.getByTestId("pagination-bar")).toHaveStyle({
    position: "absolute",
  })
})
