export const getStatusColor = (status: string | undefined) => {
  if (!status) {
    return 'white';
  }

  const statusInt = parseInt(status);

  if (isNaN(statusInt)) {
    return 'white';
  }

  return statusInt >= 500
    ? 'red'
    : statusInt >= 400
      ? 'yellow'
      : statusInt >= 300
        ? 'cyan'
        : 'green';
};
