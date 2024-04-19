ARMCoreArm = function (cpu) {
	this.cpu = cpu;
	
	//针对不同寻址模式(根据指令编码确定)的函数,这些函数用于计算立即数寻址模式下的内存地址
	//并可能更新寄存器的值
	//这一个函数主要是对寄存器内的内容进行的修改
	this.addressingMode23Immediate = [
		// 000x0
		//rn代表寄存器编号,后续确定一下
		function(rn, offset, condOp) {
			//gprs是寄存器,pc为程序计数器,cpsr为状态寄存器
			//offset为一个整数值,表示相对于rn寄存器内容的偏移量
			//condOp,一个可选的条件函数,若非null则在执行判断条件前会判断该函数返回值是否为真
			var gprs = cpu.gprs;
			var address = function() {
				//获取当前寄存器的当前值
				var addr = gprs[rn];
				if (!condOp || condOp()) {
					//如果为真则从rn寄存器中减去给定的offset值
					gprs[rn] -= offset;
				}
				return addr;
			};
			//判断是否为PC寄存器,如果是则返回true
			address.writesPC = rn == cpu.PC;
			return address;
		},

		// 000xW
		//表示对这个寄存器不进行任何操作
		null,

		null,
		null,

		// 00Ux0

		function(rn, offset, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn];
				if (!condOp || condOp()) {
					////如果为真则从rn寄存器中加上给定的offset值
					gprs[rn] += offset;
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		// 00UxW
		null,

		null,
		null,

		// 0P0x0
		function(rn, offset, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				//从寄存器中减去给定的offset,得到最终的内存地址
				return addr = gprs[rn] - offset;
			};
			address.writesPC = false;
			return address;
		},

		// 0P0xW
		function(rn, offset, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn] - offset;
				if (!condOp || condOp()) {
					gprs[rn] = addr;
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		null,
		null,

		// 0PUx0
		function(rn, offset, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				return addr = gprs[rn] + offset;
			};
			address.writesPC = false;
			return address;
		},

		// 0PUxW
		function(rn, offset, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn] + offset;
				if (!condOp || condOp()) {
					gprs[rn] = addr;
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		null,
		null,
	];

	//这个函数主要用来进行寄存器之间的操作
	//rn和rm分别表示两个寄存器的编号
	this.addressingMode23Register = [
		// I00x0
		function(rn, rm, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn];
				if (!condOp || condOp()) {
					gprs[rn] -= gprs[rm];
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		// I00xW
		null,

		null,
		null,

		// I0Ux0
		function(rn, rm, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn];
				if (!condOp || condOp()) {
					gprs[rn] += gprs[rm];
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		// I0UxW
		null,

		null,
		null,

		// IP0x0
		function(rn, rm, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				return gprs[rn] - gprs[rm];
			};
			address.writesPC = false;
			return address;
		},

		// IP0xW
		function(rn, rm, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn] - gprs[rm];
				if (!condOp || condOp()) {
					gprs[rn] = addr;
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		null,
		null,

		// IPUx0
		function(rn, rm, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn] + gprs[rm];
				return addr;
			};
			address.writesPC = false;
			return address;
		},

		// IPUxW
		function(rn, rm, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn] + gprs[rm];
				if (!condOp || condOp()) {
					gprs[rn] = addr;
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		null,
		null
	];

	//这个函数对寄存器进行移位操作
	//rn表示寄存器编号
	//shiftOp是一个函数,表示待执行的移位操作,调用这个函数计算出一个移位后的值,随后进行运算
	this.addressingMode2RegisterShifted = [
		// I00x0
		function(rn, shiftOp, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn];
				if (!condOp || condOp()) {
					shiftOp();
					gprs[rn] -= cpu.shifterOperand;
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		// I00xW
		null,

		null,
		null,

		// I0Ux0
		function(rn, shiftOp, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				var addr = gprs[rn];
				if (!condOp || condOp()) {
					shiftOp();
					gprs[rn] += cpu.shifterOperand;
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},
		// I0UxW
		null,

		null,
		null,

		// IP0x0
		function(rn, shiftOp, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				shiftOp();
				return gprs[rn] - cpu.shifterOperand;
			};
			address.writesPC = false;
			return address;
		},

		// IP0xW
		function(rn, shiftOp, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				shiftOp();
				var addr = gprs[rn] - cpu.shifterOperand;
				if (!condOp || condOp()) {
					gprs[rn] = addr;
				}
				return addr;
			};
			address.writesPC = rn == cpu.PC;
			return address;
		},

		null,
		null,

		// IPUx0
		function(rn, shiftOp, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				shiftOp();
				return gprs[rn] + cpu.shifterOperand;
			};
			address.writesPC = false;
			return address;
		},

		// IPUxW
		function(rn, shiftOp, condOp) {
			var gprs = cpu.gprs;
			var address = function() {
				shiftOp();
				var addr = gprs[rn] + cpu.shifterOperand;
				if (!condOp || condOp()) {
					gprs[rn] = addr;
				}
				return addr;
			};
			address.writePC = rn == cpu.PC;
			return address;
		},

		null,
		null,
	];
}

//构建ARM处理器的寻址模式(算数右移)操作
//rs表示源寄存器编号,通常表示需要进行算术右移操作的寄存器
//rm代表移位值来源寄存器编号,通常表示提供移位位数的寄存器
ARMCoreArm.prototype.constructAddressingMode1ASR = function(rs, rm) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		//每次调用该函数之后,递增cpu的周期数
		++cpu.cycles;
		var shift = gprs[rs];
		//如果rs指向程序计数器,则在其基础上加4,因为指令寄存器通常指向下一条指令地址,
		//而非当前指令地址
		//换句话来说,这个cpu是4位的吗
		if (rs == cpu.PC) {
			shift += 4;
		}
		//对移位位数取模8,保证位数在0-255之间
		shift &= 0xFF;
		//获取偏移值
		var shiftVal =  gprs[rm];
		if (rm == cpu.PC) {
			shiftVal += 4;
		}
		if (shift == 0) {
			cpu.shifterOperand = shiftVal;
			//cpsrC表示当前处理器状态寄存器中的进位标志位
			//这个标志用来表示在最近的运算中是否存在溢出或借位现象
			cpu.shifterCarryOut = cpu.cpsrC;
		} else if (shift < 32) {
			//执行算术右移操作
			//并计算进位的位数
			cpu.shifterOperand = shiftVal >> shift;
			//分析一下这个函数
			//以shift=3为例,1<<(3-1)=1*2^2=4
			//这个时候shiftVal & (1 << (shift - 1))的结果其实是将要被保留下来的值
			//以更好理解的十进制为例,1<<(3-1)=1*10^2=100
			//   13103/100=13,可以看到13被留了下来
			cpu.shifterCarryOut = shiftVal & (1 << (shift - 1));
		} else if (gprs[rm] >> 31) {
			//注意接下来两个else都是用来处理溢出的情况
			//检查最高位是否为1,如果最高位是1则代表寄存器内的数是负数
			//如果是1则将值设置为0xFFFFFFFF,等价于十进制中的-1
			//这表示如果移位位数来源于负数,则将所有位都设置为1并保留负数特性
			cpu.shifterOperand = 0xFFFFFFFF;
			// 这个数表示最高位为1的32位整数,十进制值为-2147483648
			//这表示在进行算数右移过程中,即使移位位数超过31位(导致数值溢出)
			//仍然保留最高位为1,保持移位前的负数特性
			// ps:二进制下这个数是 1000 0000 0000 0000 0000 0000 0000 0000
			//也就是表示发生了溢出的意思
			cpu.shifterCarryOut = 0x80000000;
		} else {
			//表示如果移位位数来自于非负数寄存器,则移位操作结果为0
			//此时不产生进位,也不发生溢出
			cpu.shifterOperand = 0;
			cpu.shifterCarryOut = 0;
		}
	};
};

//构建ARM处理器的寻址模式1(立即数)操作,返回一个处理该模式的函数
//该函数在执行时,根据输入的立即数,设置cpu的相关状态
ARMCoreArm.prototype.constructAddressingMode1Immediate = function(immediate) {
	var cpu = this.cpu;
	return function() {
		cpu.shifterOperand = immediate;
		cpu.shifterCarryOut = cpu.cpsrC;
	};
};

//构建ARM处理器的寻址模式1(立即数旋转)操作
ARMCoreArm.prototype.constructAddressingMode1ImmediateRotate = function(immediate, rotate) {
	var cpu = this.cpu;
	return function() {
		//下面对这个函数进行详细解析
		//immediate >>> rotate 使用无符号右移,无符号右移不考虑数值的符号,一律按整数处理
		//在移动过程中,最左侧(高位)被移出的位始终用0进行填充
		// (immediate << (32 - rotate))  使用左移运算符将immediate向左移动 32 -rotate 位,低位补0,这相当于将immediate 的高 32 - rotate 位移动到低32位
		//最后使用按位 | 来讲两部分结果合并,两个位中至少有一个结果为1,则结果为1
		//这样做的目的是将立即数的高位和低位进行循环位移,并且旋转后的立即数数值大小和原立即数相同(二进制表达相同)
		//但是位的顺序有所调整
		//问题在于为什么要这样做?
		cpu.shifterOperand = (immediate >>> rotate) | (immediate << (32 - rotate));
		cpu.shifterCarryOut = cpu.shifterOperand >> 31;
	}
};

//构建ARM处理器的寻址模式1(逻辑左移操作)
//rs表示需要进行逻辑左移操作的寄存器
//rm表示提供移位位数的寄存器
ARMCoreArm.prototype.constructAddressingMode1LSL = function(rs, rm) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		//调用的时候增加cpu的周期数
		++cpu.cycles;
		var shift = gprs[rs];
		if (rs == cpu.PC) {
			shift += 4;
		}
		shift &= 0xFF;
		var shiftVal =  gprs[rm];
		if (rm == cpu.PC) {
			shiftVal += 4;
		}
		if (shift == 0) {
			cpu.shifterOperand = shiftVal;
			cpu.shifterCarryOut = cpu.cpsrC;
		} else if (shift < 32) {
			cpu.shifterOperand = shiftVal << shift;
			cpu.shifterCarryOut = shiftVal & (1 << (32 - shift));
		} else if (shift == 32) {
			cpu.shifterOperand = 0;
			cpu.shifterCarryOut = shiftVal & 1;
		} else {
			cpu.shifterOperand = 0;
			cpu.shifterCarryOut = 0;
		}
	};
};

//构建ARM处理器的寻址模式(逻辑右移)
ARMCoreArm.prototype.constructAddressingMode1LSR = function(rs, rm) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		++cpu.cycles;
		var shift = gprs[rs];
		if (rs == cpu.PC) {
			shift += 4;
		}
		shift &= 0xFF;
		var shiftVal =  gprs[rm];
		if (rm == cpu.PC) {
			shiftVal += 4;
		}
		if (shift == 0) {
			cpu.shifterOperand = shiftVal;
			cpu.shifterCarryOut = cpu.cpsrC;
		} else if (shift < 32) {
			cpu.shifterOperand = shiftVal >>> shift;
			cpu.shifterCarryOut = shiftVal & (1 << (shift - 1));
		} else if (shift == 32) {
			cpu.shifterOperand = 0;
			cpu.shifterCarryOut = shiftVal >> 31;
		} else {
			cpu.shifterOperand = 0;
			cpu.shifterCarryOut = 0;
		}
	};
};


//循环右移
ARMCoreArm.prototype.constructAddressingMode1ROR = function(rs, rm) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		++cpu.cycles;
		var shift = gprs[rs];
		if (rs == cpu.PC) {
			shift += 4;
		}
		shift &= 0xFF;
		var shiftVal =  gprs[rm];
		if (rm == cpu.PC) {
			shiftVal += 4;
		}
		var rotate = shift & 0x1F;
		if (shift == 0) {
			cpu.shifterOperand = shiftVal;
			cpu.shifterCarryOut = cpu.cpsrC;
		} else if (rotate) {
			cpu.shifterOperand = (gprs[rm] >>> rotate) | (gprs[rm] << (32 - rotate));
			cpu.shifterCarryOut = shiftVal & (1 << (rotate - 1));
		} else {
			cpu.shifterOperand = shiftVal;
			cpu.shifterCarryOut = shiftVal >> 31;
		}
	};
};

//instruction代表正在进行解析的ARM指令,其中包含了寻址模式和操作码等信息

ARMCoreArm.prototype.constructAddressingMode23Immediate = function(instruction, immediate, condOp) {
	var rn = (instruction & 0x000F0000) >> 16;
	return this.addressingMode23Immediate[(instruction & 0x01A00000) >> 21](rn, immediate, condOp);
};

ARMCoreArm.prototype.constructAddressingMode23Register = function(instruction, rm, condOp) {
	var rn = (instruction & 0x000F0000) >> 16;
	return this.addressingMode23Register[(instruction & 0x01A00000) >> 21](rn, rm, condOp);
};

ARMCoreArm.prototype.constructAddressingMode2RegisterShifted = function(instruction, shiftOp, condOp) {
	var rn = (instruction & 0x000F0000) >> 16;
	return this.addressingMode2RegisterShifted[(instruction & 0x01A00000) >> 21](rn, shiftOp, condOp);
};

ARMCoreArm.prototype.constructAddressingMode4 = function(immediate, rn) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		var addr = gprs[rn] + immediate;
		return addr;
	}
};

ARMCoreArm.prototype.constructAddressingMode4Writeback = function(immediate, offset, rn, overlap) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function(writeInitial) {
		var addr = gprs[rn] + immediate;
		if (writeInitial && overlap) {
			cpu.mmu.store32(gprs[rn] + immediate - 4, gprs[rn]);
		}
		gprs[rn] += offset;
		return addr;
	}
};

ARMCoreArm.prototype.constructADC = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var shifterOperand = (cpu.shifterOperand >>> 0) + !!cpu.cpsrC;
		gprs[rd] = (gprs[rn] >>> 0) + shifterOperand;
	};
};

ARMCoreArm.prototype.constructADCS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var shifterOperand = (cpu.shifterOperand >>> 0) + !!cpu.cpsrC;
		var d = (gprs[rn] >>> 0) + shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = d >> 31;
			cpu.cpsrZ = !(d & 0xFFFFFFFF);
			cpu.cpsrC = d > 0xFFFFFFFF;
			cpu.cpsrV = (gprs[rn] >> 31) == (shifterOperand >> 31) &&
						(gprs[rn] >> 31) != (d >> 31) &&
						(shifterOperand >> 31) != (d >> 31);
		}
		gprs[rd] = d;
	};
};

ARMCoreArm.prototype.constructADD = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = (gprs[rn] >>> 0) + (cpu.shifterOperand >>> 0);
	};
};

ARMCoreArm.prototype.constructADDS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var d = (gprs[rn] >>> 0) + (cpu.shifterOperand >>> 0);
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = d >> 31;
			cpu.cpsrZ = !(d & 0xFFFFFFFF);
			cpu.cpsrC = d > 0xFFFFFFFF;
			cpu.cpsrV = (gprs[rn] >> 31) == (cpu.shifterOperand >> 31) &&
						(gprs[rn] >> 31) != (d >> 31) &&
						(cpu.shifterOperand >> 31) != (d >> 31);
		}
		gprs[rd] = d;
	};
};

ARMCoreArm.prototype.constructAND = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] & cpu.shifterOperand;
	};
};

ARMCoreArm.prototype.constructANDS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] & cpu.shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = gprs[rd] >> 31;
			cpu.cpsrZ = !(gprs[rd] & 0xFFFFFFFF);
			cpu.cpsrC = cpu.shifterCarryOut;
		}
	};
};

ARMCoreArm.prototype.constructB = function(immediate, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		if (condOp && !condOp()) {
			cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		gprs[cpu.PC] += immediate;
	};
};

ARMCoreArm.prototype.constructBIC = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] & ~cpu.shifterOperand;
	};
};

ARMCoreArm.prototype.constructBICS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] & ~cpu.shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = gprs[rd] >> 31;
			cpu.cpsrZ = !(gprs[rd] & 0xFFFFFFFF);
			cpu.cpsrC = cpu.shifterCarryOut;
		}
	};
};

ARMCoreArm.prototype.constructBL = function(immediate, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		if (condOp && !condOp()) {
			cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		gprs[cpu.LR] = gprs[cpu.PC] - 4;
		gprs[cpu.PC] += immediate;
	};
};

ARMCoreArm.prototype.constructBX = function(rm, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		if (condOp && !condOp()) {
			cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		cpu.switchExecMode(gprs[rm] & 0x00000001);
		gprs[cpu.PC] = gprs[rm] & 0xFFFFFFFE;
	};
};

ARMCoreArm.prototype.constructCMN = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var aluOut = (gprs[rn] >>> 0) + (cpu.shifterOperand >>> 0);
		cpu.cpsrN = aluOut >> 31;
		cpu.cpsrZ = !(aluOut & 0xFFFFFFFF);
		cpu.cpsrC = aluOut > 0xFFFFFFFF;
		cpu.cpsrV = (gprs[rn] >> 31) == (cpu.shifterOperand >> 31) &&
					(gprs[rn] >> 31) != (aluOut >> 31) &&
					(cpu.shifterOperand >> 31) != (aluOut >> 31);
	};
};

ARMCoreArm.prototype.constructCMP = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var aluOut = gprs[rn] - cpu.shifterOperand;
		cpu.cpsrN = aluOut >> 31;
		cpu.cpsrZ = !(aluOut & 0xFFFFFFFF);
		cpu.cpsrC = (gprs[rn] >>> 0) >= (cpu.shifterOperand >>> 0);
		cpu.cpsrV = (gprs[rn] >> 31) != (cpu.shifterOperand >> 31) &&
					(gprs[rn] >> 31) != (aluOut >> 31);
	};
};

ARMCoreArm.prototype.constructEOR = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] ^ cpu.shifterOperand;
	};
};

ARMCoreArm.prototype.constructEORS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] ^ cpu.shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = gprs[rd] >> 31;
			cpu.cpsrZ = !(gprs[rd] & 0xFFFFFFFF);
			cpu.cpsrC = cpu.shifterCarryOut;
		}
	};
};

ARMCoreArm.prototype.constructLDM = function(rs, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	var mmu = cpu.mmu;
	return function() {
		mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		var addr = address(false);
		var total = 0;
		var m, i;
		for (m = rs, i = 0; m; m >>= 1, ++i) {
			if (m & 1) {
				gprs[i] = mmu.load32(addr & 0xFFFFFFFC);
				addr += 4;
				++total;
			}
		}
		mmu.waitMulti32(addr, total);
		++cpu.cycles;
	};
};

ARMCoreArm.prototype.constructLDMS = function(rs, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	var mmu = cpu.mmu;
	return function() {
		mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		var addr = address(false);
		var total = 0;
		var mode = cpu.mode;
		cpu.switchMode(cpu.MODE_SYSTEM);
		var m, i;
		for (m = rs, i = 0; m; m >>= 1, ++i) {
			if (m & 1) {
				gprs[i] = mmu.load32(addr & 0xFFFFFFFC);
				addr += 4;
				++total;
			}
		}
		cpu.switchMode(mode);
		mmu.waitMulti32(addr, total);
		++cpu.cycles;
	};
};

ARMCoreArm.prototype.constructLDR = function(rd, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		var addr = address();
		gprs[rd] = cpu.mmu.load32(addr);
		cpu.mmu.wait32(addr);
		++cpu.cycles;
	};
};

ARMCoreArm.prototype.constructLDRB = function(rd, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		var addr = address();
		gprs[rd] = cpu.mmu.loadU8(addr);
		cpu.mmu.wait(addr);
		++cpu.cycles;
	};
};

ARMCoreArm.prototype.constructLDRH = function(rd, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		var addr = address();
		gprs[rd] = cpu.mmu.loadU16(addr);
		cpu.mmu.wait(addr);
		++cpu.cycles;
	};
};

ARMCoreArm.prototype.constructLDRSB = function(rd, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		var addr = address();
		gprs[rd] = cpu.mmu.load8(addr);
		cpu.mmu.wait(addr);
		++cpu.cycles;
	};
};

ARMCoreArm.prototype.constructLDRSH = function(rd, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		var addr = address();
		gprs[rd] = cpu.mmu.load16(addr);
		cpu.mmu.wait(addr);
		++cpu.cycles;
	};
};

ARMCoreArm.prototype.constructMLA = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		++cpu.cycles;
		cpu.mmu.waitMul(rs);
		if ((gprs[rm] & 0xFFFF0000) && (gprs[rs] & 0xFFFF0000)) {
			// Our data type is a double--we'll lose bits if we do it all at once!
			var hi = ((gprs[rm] & 0xFFFF0000) * gprs[rs]) & 0xFFFFFFFF;
			var lo = ((gprs[rm] & 0x0000FFFF) * gprs[rs]) & 0xFFFFFFFF;
			gprs[rd] = (hi + lo + gprs[rn]) & 0xFFFFFFFF;
		} else {
			gprs[rd] = gprs[rm] * gprs[rs] + gprs[rn];
		}
	};
};

ARMCoreArm.prototype.constructMLAS = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		++cpu.cycles;
		cpu.mmu.waitMul(rs);
		if ((gprs[rm] & 0xFFFF0000) && (gprs[rs] & 0xFFFF0000)) {
			// Our data type is a double--we'll lose bits if we do it all at once!
			var hi = ((gprs[rm] & 0xFFFF0000) * gprs[rs]) & 0xFFFFFFFF;
			var lo = ((gprs[rm] & 0x0000FFFF) * gprs[rs]) & 0xFFFFFFFF;
			gprs[rd] = (hi + lo + gprs[rn]) & 0xFFFFFFFF;
		} else {
			gprs[rd] = gprs[rm] * gprs[rs] + gprs[rn];
		}
		cpu.cpsrN = gprs[rd] >> 31;
		cpu.cpsrZ = !(gprs[rd] & 0xFFFFFFFF);
	};
};

ARMCoreArm.prototype.constructMOV = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = cpu.shifterOperand;
	};
};

ARMCoreArm.prototype.constructMOVS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = cpu.shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = gprs[rd] >> 31;
			cpu.cpsrZ = !(gprs[rd] & 0xFFFFFFFF);
			cpu.cpsrC = cpu.shifterCarryOut;
		}
	};
};

ARMCoreArm.prototype.constructMRS = function(rd, r, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		if (r) {
			gprs[rd] = cpu.spsr;
		} else {
			gprs[rd] = cpu.packCPSR();
		}
	};
};

ARMCoreArm.prototype.constructMSR = function(rm, r, instruction, immediate, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	var c = instruction & 0x00010000;
	//var x = instruction & 0x00020000;
	//var s = instruction & 0x00040000;
	var f = instruction & 0x00080000;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		var operand;
		if (instruction & 0x02000000) {
			operand = immediate;
		} else {
			operand = gprs[rm];
		}
		var mask = (c ? 0x000000FF : 0x00000000) |
				   //(x ? 0x0000FF00 : 0x00000000) | // Irrelevant on ARMv4T
				   //(s ? 0x00FF0000 : 0x00000000) | // Irrelevant on ARMv4T
				   (f ? 0xFF000000 : 0x00000000);

		if (r) {
			mask &= cpu.USER_MASK | cpu.PRIV_MASK | cpu.STATE_MASK;
			cpu.spsr = (cpu.spsr & ~mask) | (operand & mask);
		} else {
			if (mask & cpu.USER_MASK) {
				cpu.cpsrN = operand >> 31;
				cpu.cpsrZ = operand & 0x40000000;
				cpu.cpsrC = operand & 0x20000000;
				cpu.cpsrV = operand & 0x10000000;
			}
			if (cpu.mode != cpu.MODE_USER && (mask & cpu.PRIV_MASK)) {
				cpu.switchMode((operand & 0x0000000F) | 0x00000010);
				cpu.cpsrI = operand & 0x00000080;
				cpu.cpsrF = operand & 0x00000040;
			}
		}
	};
};

ARMCoreArm.prototype.constructMUL = function(rd, rs, rm, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		cpu.mmu.waitMul(gprs[rs]);
		if ((gprs[rm] & 0xFFFF0000) && (gprs[rs] & 0xFFFF0000)) {
			// Our data type is a double--we'll lose bits if we do it all at once!
			var hi = ((gprs[rm] & 0xFFFF0000) * gprs[rs]) | 0;
			var lo = ((gprs[rm] & 0x0000FFFF) * gprs[rs]) | 0;
			gprs[rd] = hi + lo;
		} else {
			gprs[rd] = gprs[rm] * gprs[rs];
		}
	};
};

ARMCoreArm.prototype.constructMULS = function(rd, rs, rm, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		cpu.mmu.waitMul(gprs[rs]);
		if ((gprs[rm] & 0xFFFF0000) && (gprs[rs] & 0xFFFF0000)) {
			// Our data type is a double--we'll lose bits if we do it all at once!
			var hi = ((gprs[rm] & 0xFFFF0000) * gprs[rs]) | 0;
			var lo = ((gprs[rm] & 0x0000FFFF) * gprs[rs]) | 0;
			gprs[rd] = hi + lo;
		} else {
			gprs[rd] = gprs[rm] * gprs[rs];
		}
		cpu.cpsrN = gprs[rd] >> 31;
		cpu.cpsrZ = !(gprs[rd] & 0xFFFFFFFF);
	};
};

ARMCoreArm.prototype.constructMVN = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = ~cpu.shifterOperand;
	};
};

ARMCoreArm.prototype.constructMVNS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = ~cpu.shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = gprs[rd] >> 31;
			cpu.cpsrZ = !(gprs[rd] & 0xFFFFFFFF);
			cpu.cpsrC = cpu.shifterCarryOut;
		}
	};
};

ARMCoreArm.prototype.constructORR = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] | cpu.shifterOperand;
	}
};

ARMCoreArm.prototype.constructORRS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] | cpu.shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = gprs[rd] >> 31;
			cpu.cpsrZ = !(gprs[rd] & 0xFFFFFFFF);
			cpu.cpsrC = cpu.shifterCarryOut;
		}
	};
};

ARMCoreArm.prototype.constructRSB = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = cpu.shifterOperand - gprs[rn];
	};
};

ARMCoreArm.prototype.constructRSBS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var d = cpu.shifterOperand - gprs[rn];
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = d >> 31;
			cpu.cpsrZ = !(d & 0xFFFFFFFF);
			cpu.cpsrC = (cpu.shifterOperand >>> 0) >= (gprs[rn] >>> 0);
			cpu.cpsrV = (cpu.shifterOperand >> 31) != (gprs[rn] >> 31) &&
						(cpu.shifterOperand >> 31) != (d >> 31);
		}
		gprs[rd] = d;
	};
};

ARMCoreArm.prototype.constructRSC = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var n = (gprs[rn] >>> 0) + !cpu.cpsrC;
		gprs[rd] = (cpu.shifterOperand >>> 0) - n;
	};
};

ARMCoreArm.prototype.constructRSCS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var n = (gprs[rn] >>> 0) + !cpu.cpsrC;
		var d = (cpu.shifterOperand >>> 0) - n;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = d >> 31;
			cpu.cpsrZ = !(d & 0xFFFFFFFF);
			cpu.cpsrC = (cpu.shifterOperand >>> 0) >= (d >>> 0);
			cpu.cpsrV = (cpu.shifterOperand >> 31) != (n >> 31) &&
						(cpu.shifterOperand >> 31) != (d >> 31);
		}
		gprs[rd] = d;
	};
};

ARMCoreArm.prototype.constructSBC = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var shifterOperand = (cpu.shifterOperand >>> 0) + !cpu.cpsrC;
		gprs[rd] = (gprs[rn] >>> 0) - shifterOperand;
	};
};

ARMCoreArm.prototype.constructSBCS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var shifterOperand = (cpu.shifterOperand >>> 0) + !cpu.cpsrC;
		var d = (gprs[rn] >>> 0) - shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = d >> 31;
			cpu.cpsrZ = !(d & 0xFFFFFFFF);
			cpu.cpsrC = (gprs[rn] >>> 0) >= (d >>> 0);
			cpu.cpsrV = (gprs[rn] >> 31) != (shifterOperand >> 31) &&
						(gprs[rn] >> 31) != (d >> 31);
		}
		gprs[rd] = d;
	};
};

ARMCoreArm.prototype.constructSMLAL = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var SHIFT_32 = 1/0x100000000;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		cpu.cycles += 2;
		cpu.mmu.waitMul(rs);
		var hi = (gprs[rm] & 0xFFFF0000) * gprs[rs];
		var lo = (gprs[rm] & 0x0000FFFF) * gprs[rs];
		var carry = (gprs[rn] >>> 0) + hi + lo;
		gprs[rn] = carry;
		gprs[rd] += Math.floor(carry * SHIFT_32);
	};
};

ARMCoreArm.prototype.constructSMLALS = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var SHIFT_32 = 1/0x100000000;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		cpu.cycles += 2;
		cpu.mmu.waitMul(rs);
		var hi = (gprs[rm] & 0xFFFF0000) * gprs[rs];
		var lo = (gprs[rm] & 0x0000FFFF) * gprs[rs];
		var carry = (gprs[rn] >>> 0) + hi + lo;
		gprs[rn] = carry;
		gprs[rd] += Math.floor(carry * SHIFT_32);
		cpu.cpsrN = gprs[rd] >> 31;
		cpu.cpsrZ = !((gprs[rd] & 0xFFFFFFFF) || (gprs[rn] & 0xFFFFFFFF));
	};
};

ARMCoreArm.prototype.constructSMULL = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var SHIFT_32 = 1/0x100000000;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		++cpu.cycles;
		cpu.mmu.waitMul(gprs[rs]);
		var hi = ((gprs[rm] & 0xFFFF0000) >> 0) * (gprs[rs] >> 0);
		var lo = ((gprs[rm] & 0x0000FFFF) >> 0) * (gprs[rs] >> 0);
		gprs[rn] = ((hi & 0xFFFFFFFF) + (lo & 0xFFFFFFFF)) & 0xFFFFFFFF;
		gprs[rd] = Math.floor(hi * SHIFT_32 + lo * SHIFT_32);
	};
};

ARMCoreArm.prototype.constructSMULLS = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var SHIFT_32 = 1/0x100000000;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		++cpu.cycles;
		cpu.mmu.waitMul(gprs[rs]);
		var hi = ((gprs[rm] & 0xFFFF0000) >> 0) * (gprs[rs] >> 0);
		var lo = ((gprs[rm] & 0x0000FFFF) >> 0) * (gprs[rs] >> 0);
		gprs[rn] = ((hi & 0xFFFFFFFF) + (lo & 0xFFFFFFFF)) & 0xFFFFFFFF;
		gprs[rd] = Math.floor(hi * SHIFT_32 + lo * SHIFT_32);
		cpu.cpsrN = gprs[rd] >> 31;
		cpu.cpsrZ = !((gprs[rd] & 0xFFFFFFFF) || (gprs[rn] & 0xFFFFFFFF));
	};
};

ARMCoreArm.prototype.constructSTM = function(rs, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	var mmu = cpu.mmu;
	return function() {
		if (condOp && !condOp()) {
			mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		mmu.wait32(gprs[cpu.PC]);
		var addr = address(true);
		var total = 0;
		var m, i;
		for (m = rs, i = 0; m; m >>= 1, ++i) {
			if (m & 1) {
				mmu.store32(addr, gprs[i]);
				addr += 4;
				++total;
			}
		}
		mmu.waitMulti32(addr, total);
	};
};

ARMCoreArm.prototype.constructSTMS = function(rs, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	var mmu = cpu.mmu;
	return function() {
		if (condOp && !condOp()) {
			mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		mmu.wait32(gprs[cpu.PC]);
		var mode = cpu.mode;
		var addr = address(true);
		var total = 0;
		var m, i;
		cpu.switchMode(cpu.MODE_SYSTEM);
		for (m = rs, i = 0; m; m >>= 1, ++i) {
			if (m & 1) {
				mmu.store32(addr, gprs[i]);
				addr += 4;
				++total;
			}
		}
		cpu.switchMode(mode);
		mmu.waitMulti32(addr, total);
	};
};

ARMCoreArm.prototype.constructSTR = function(rd, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		if (condOp && !condOp()) {
			cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		var addr = address();
		cpu.mmu.store32(addr, gprs[rd]);
		cpu.mmu.wait32(addr);
		cpu.mmu.wait32(gprs[cpu.PC]);
	};
};

ARMCoreArm.prototype.constructSTRB = function(rd, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		if (condOp && !condOp()) {
			cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		var addr = address();
		cpu.mmu.store8(addr, gprs[rd]);
		cpu.mmu.wait(addr);
		cpu.mmu.wait32(gprs[cpu.PC]);
	};
};

ARMCoreArm.prototype.constructSTRH = function(rd, address, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		if (condOp && !condOp()) {
			cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		var addr = address();
		cpu.mmu.store16(addr, gprs[rd]);
		cpu.mmu.wait(addr);
		cpu.mmu.wait32(gprs[cpu.PC]);
	};
};

ARMCoreArm.prototype.constructSUB = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		gprs[rd] = gprs[rn] - cpu.shifterOperand;
	};
};

ARMCoreArm.prototype.constructSUBS = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var d = gprs[rn] - cpu.shifterOperand;
		if (rd == cpu.PC && cpu.hasSPSR()) {
			cpu.unpackCPSR(cpu.spsr);
		} else {
			cpu.cpsrN = d >> 31;
			cpu.cpsrZ = !(d & 0xFFFFFFFF);
			cpu.cpsrC = (gprs[rn] >>> 0) >= (cpu.shifterOperand >>> 0);
			cpu.cpsrV = (gprs[rn] >> 31) != (cpu.shifterOperand >> 31) &&
						(gprs[rn] >> 31) != (d >> 31);
		}
		gprs[rd] = d;
	};
};

ARMCoreArm.prototype.constructSWI = function(immediate, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		if (condOp && !condOp()) {
			cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
			return;
		}
		cpu.irq.swi32(immediate);
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
	};
};

ARMCoreArm.prototype.constructSWP = function(rd, rn, rm, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		cpu.mmu.wait32(gprs[rn]);
		cpu.mmu.wait32(gprs[rn]);
		var d = cpu.mmu.load32(gprs[rn]);
		cpu.mmu.store32(gprs[rn], gprs[rm]);
		gprs[rd] = d;
		++cpu.cycles;
	}
};

ARMCoreArm.prototype.constructSWPB = function(rd, rn, rm, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		cpu.mmu.wait(gprs[rn]);
		cpu.mmu.wait(gprs[rn]);
		var d = cpu.mmu.load8(gprs[rn]);
		cpu.mmu.store8(gprs[rn], gprs[rm]);
		gprs[rd] = d;
		++cpu.cycles;
	}
};

ARMCoreArm.prototype.constructTEQ = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var aluOut = gprs[rn] ^ cpu.shifterOperand;
		cpu.cpsrN = aluOut >> 31;
		cpu.cpsrZ = !(aluOut & 0xFFFFFFFF);
		cpu.cpsrC = cpu.shifterCarryOut;
	};
};

ARMCoreArm.prototype.constructTST = function(rd, rn, shiftOp, condOp) {
	var cpu = this.cpu;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		shiftOp();
		var aluOut = gprs[rn] & cpu.shifterOperand;
		cpu.cpsrN = aluOut >> 31;
		cpu.cpsrZ = !(aluOut & 0xFFFFFFFF);
		cpu.cpsrC = cpu.shifterCarryOut;
	};
};

ARMCoreArm.prototype.constructUMLAL = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var SHIFT_32 = 1/0x100000000;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		cpu.cycles += 2;
		cpu.mmu.waitMul(rs);
		var hi = ((gprs[rm] & 0xFFFF0000) >>> 0) * (gprs[rs] >>> 0);
		var lo = (gprs[rm] & 0x0000FFFF) * (gprs[rs] >>> 0);
		var carry = (gprs[rn] >>> 0) + hi + lo;
		gprs[rn] = carry;
		gprs[rd] += carry * SHIFT_32;
	};
};

ARMCoreArm.prototype.constructUMLALS = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var SHIFT_32 = 1/0x100000000;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		cpu.cycles += 2;
		cpu.mmu.waitMul(rs);
		var hi = ((gprs[rm] & 0xFFFF0000) >>> 0) * (gprs[rs] >>> 0);
		var lo = (gprs[rm] & 0x0000FFFF) * (gprs[rs] >>> 0);
		var carry = (gprs[rn] >>> 0) + hi + lo;
		gprs[rn] = carry;
		gprs[rd] += carry * SHIFT_32;
		cpu.cpsrN = gprs[rd] >> 31;
		cpu.cpsrZ = !((gprs[rd] & 0xFFFFFFFF) || (gprs[rn] & 0xFFFFFFFF));
	};
};

ARMCoreArm.prototype.constructUMULL = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var SHIFT_32 = 1/0x100000000;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		++cpu.cycles;
		cpu.mmu.waitMul(gprs[rs]);
		var hi = ((gprs[rm] & 0xFFFF0000) >>> 0) * (gprs[rs] >>> 0);
		var lo = ((gprs[rm] & 0x0000FFFF) >>> 0) * (gprs[rs] >>> 0);
		gprs[rn] = ((hi & 0xFFFFFFFF) + (lo & 0xFFFFFFFF)) & 0xFFFFFFFF;
		gprs[rd] = (hi * SHIFT_32 + lo * SHIFT_32) >>> 0;
	};
};

ARMCoreArm.prototype.constructUMULLS = function(rd, rn, rs, rm, condOp) {
	var cpu = this.cpu;
	var SHIFT_32 = 1/0x100000000;
	var gprs = cpu.gprs;
	return function() {
		cpu.mmu.waitPrefetch32(gprs[cpu.PC]);
		if (condOp && !condOp()) {
			return;
		}
		++cpu.cycles;
		cpu.mmu.waitMul(gprs[rs]);
		var hi = ((gprs[rm] & 0xFFFF0000) >>> 0) * (gprs[rs] >>> 0);
		var lo = ((gprs[rm] & 0x0000FFFF) >>> 0) * (gprs[rs] >>> 0);
		gprs[rn] = ((hi & 0xFFFFFFFF) + (lo & 0xFFFFFFFF)) & 0xFFFFFFFF;
		gprs[rd] = (hi * SHIFT_32 + lo * SHIFT_32) >>> 0;
		cpu.cpsrN = gprs[rd] >> 31;
		cpu.cpsrZ = !((gprs[rd] & 0xFFFFFFFF) || (gprs[rn] & 0xFFFFFFFF));
	};
};
