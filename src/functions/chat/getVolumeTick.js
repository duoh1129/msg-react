export const getVolumeTick = () => {
  const vol_arr = Array.from({ length: 30 }, () =>
    Math.floor(Math.random() * 30)
  );
  return vol_arr.map((value) => (
    <div style={{ height: value }} className="vol_tick"></div>
  ));
};
